import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { mealText, mealType, date, imageBase64 } = await req.json();

        if (!mealText && !imageBase64) {
            return NextResponse.json({ error: "Please provide a meal description or photo" }, { status: 400 });
        }

        if (mealText && mealText.length > 500) {
            return NextResponse.json({ error: "Meal description too long (max 500 characters)" }, { status: 400 });
        }

        // 2. Call Moonshot AI
        const apiKey = process.env.MOONSHOT_API_KEY;
        if (!apiKey) {
            throw new Error("Missing MOONSHOT_API_KEY");
        }

        const systemPrompt = `You are a strict, expert nutritional analyst.
The user will give you a natural language description and/or an image of a meal they ate.
You must estimate the absolute best guess for the nutritional macros of that meal.
You MUST reply ONLY with a valid JSON object matching this exact structure, with NO surrounding markdown or text:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fibre": number,
  "sugar": number
}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        let moonshotRes;
        try {
            // Build content array, either text, or text + image
            const userContent: any[] = [];
            if (mealText) {
                userContent.push({ type: "text", text: mealText });
            } else if (imageBase64) {
                userContent.push({ type: "text", text: "Parse the nutrition of this meal." });
            }

            if (imageBase64) {
                userContent.push({
                    type: "image_url",
                    image_url: { url: imageBase64 }
                });
            }

            const modelName = imageBase64 ? "moonshot-v1-8k-vision-preview" : "moonshot-v1-8k";

            moonshotRes = await fetch("https://api.moonshot.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userContent },
                    ],
                    temperature: 0.1,
                }),
                signal: controller.signal,
            });
        } catch (fetchErr) {
            clearTimeout(timeout);
            const isTimeout = fetchErr instanceof DOMException && fetchErr.name === 'AbortError';
            console.error("Moonshot fetch failed:", isTimeout ? "TIMEOUT (15s)" : fetchErr);
            throw new Error(isTimeout
                ? "Moonshot AI is unreachable (timeout). The service may be down or blocked from your network."
                : `Failed to connect to Moonshot AI: ${fetchErr}`);
        }
        clearTimeout(timeout);

        if (!moonshotRes.ok) {
            const errText = await moonshotRes.text();
            console.error("Moonshot API Error Status:", moonshotRes.status);
            console.error("Moonshot API Error Body:", errText);
            throw new Error(`Moonshot AI returned ${moonshotRes.status}: ${errText}`);
        }

        const moonshotData = await moonshotRes.json();
        let aiResponseText = moonshotData.choices[0].message.content.trim();

        // Clean up potential markdown code blocks returned by the model
        if (aiResponseText.startsWith("```json")) {
            aiResponseText = aiResponseText.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (aiResponseText.startsWith("```")) {
            aiResponseText = aiResponseText.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsedMacros = JSON.parse(aiResponseText);

        // 3. Save to Supabase `meals` table
        const { data: newMeal, error: dbError } = await supabase
            .from("meals")
            .insert({
                user_id: user.id,
                meal_type: mealType,
                text_entry: mealText,
                calories: parsedMacros.calories,
                protein: parsedMacros.protein,
                carbs: parsedMacros.carbs,
                fat: parsedMacros.fat,
                fibre: parsedMacros.fibre,
                sugar: parsedMacros.sugar,
                ...(date ? { created_at: new Date(date).toISOString() } : {}),
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json(newMeal);

    } catch (error) {
        console.error("Meal Parsing Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to process meal";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
