import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
    try {
        // Check if API key is configured
        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "AI_API_KEY not configured",
            });
        }

        // Test OpenAI connection
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: process.env.AI_BASE_URL,
        });

        const response = await openai.chat.completions.create({
            model: process.env.AI_MODEL || "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Say 'test successful'" }],
            max_tokens: 10,
        });

        return NextResponse.json({
            success: true,
            message: "OpenAI connection successful",
            response: response.choices[0]?.message?.content,
            model: process.env.AI_MODEL,
        });
    } catch (error: any) {
        console.error("OpenAI test error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            errorType: error.constructor.name,
            errorDetails: error.response?.data || error.toString(),
        });
    }
}
