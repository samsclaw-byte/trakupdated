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

        const { mealText, mealType } = await req.json();

        if (!mealText || !mealType) {
            return NextResponse.json({ error: "Missing mealText or mealType" }, { status: 400 });
        }

        if (mealText.length > 500) {
            return NextResponse.json({ error: "Meal description too long (max 500 characters)" }, { status: 400 });
        }

        // 2. Call Moonshot AI Kimi 2.5
        const apiKey = process.env.MOONSHOT_API_KEY;
        if (!apiKey) {
            throw new Error("Missing MOONSHOT_API_KEY");
        }

        const systemPrompt = `You are a strict, expert nutritional analyst.
The user will give you a natural language description of a meal they ate.
You must estimate the absolute best guess for the nutritional macros of that meal.
You MUST reply ONLY with a valid JSON object matching this exact structure, with NO surrounding markdown or text:
{
  "calories": number,
  "protein": number,
  "fat": number,
  "fibre": number,
  "sugar": number
}`;

        const moonshotRes = await fetch("https://api.moonshot.cn/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "moonshot-v1-8k",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: mealText },
                ],
                temperature: 0.1,
            }),
        });

        if (!moonshotRes.ok) {
            const errText = await moonshotRes.text();
            console.error("Moonshot API Error:", errText);
            throw new Error("Failed to parse meal with AI.");
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
                fat: parsedMacros.fat,
                fibre: parsedMacros.fibre,
                sugar: parsedMacros.sugar,
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
