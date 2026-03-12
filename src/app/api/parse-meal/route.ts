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

        const { mealText, mealType, date, imageBase64, previewOnly } = await req.json();

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
You must estimate the absolute best guess for the nutritional content of that meal.
You MUST reply ONLY with a valid JSON object matching this exact structure, with NO surrounding markdown or text:
{
  "title": string (3-5 words summarizing the dish),
  "description": string (1-2 sentences detailing what is visible in the meal),
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fibre": number,
  "sugar": number,
  "micronutrients": {
    "sodium": number (mg),
    "potassium": number (mg),
    "calcium": number (mg),
    "magnesium": number (mg),
    "iron": number (mg),
    "zinc": number (mg),
    "vitamin_c": number (mg),
    "vitamin_d": number (mcg),
    "vitamin_b12": number (mcg),
    "folate": number (mcg)
  }
}
All values should be realistic estimates for a typical portion of the food described.`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        let moonshotRes;
        try {
            let userContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

            if (imageBase64) {
                userContent = [];
                if (mealText) {
                    userContent.push({ type: "text", text: mealText });
                } else {
                    userContent.push({ type: "text", text: "Parse the nutrition of this meal." });
                }
                userContent.push({
                    type: "image_url",
                    image_url: { url: imageBase64 }
                });
            } else {
                userContent = mealText;
            }

            const modelName = "kimi-k2.5";

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

        // Robust extraction of JSON object from the AI response
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("Failed to find JSON block in AI response:", aiResponseText);
            throw new Error("AI returned malformed data (no JSON block found).");
        }
        const cleanedJsonText = jsonMatch[0];
        const parsedMacros = JSON.parse(cleanedJsonText);

        if (previewOnly) {
            return NextResponse.json(parsedMacros);
        }

        // 3. Save to Supabase `meals` table
        const title = parsedMacros.title || mealText || "Logged Meal";
        const desc = parsedMacros.description;
        const text_entry = desc ? `${title} |:| ${desc}` : title;

        const { data: newMeal, error: dbError } = await supabase
            .from("meals")
            .insert({
                user_id: user.id,
                meal_type: mealType,
                text_entry: text_entry,
                calories: Number(parsedMacros.calories) || 0,
                protein: Number(parsedMacros.protein) || 0,
                carbs: Number(parsedMacros.carbs) || 0,
                fat: Number(parsedMacros.fat) || 0,
                fibre: Number(parsedMacros.fibre) || 0,
                sugar: Number(parsedMacros.sugar) || 0,
                micronutrients: parsedMacros.micronutrients || null,
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
