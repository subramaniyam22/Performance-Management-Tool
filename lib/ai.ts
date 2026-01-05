import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
});

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatOptions {
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
}

export async function chat(options: ChatOptions) {
    try {
        const response = await openai.chat.completions.create({
            model: process.env.AI_MODEL || "gpt-3.5-turbo",
            messages: options.messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
        });

        const message = response.choices[0]?.message;
        if (!message) {
            return { success: false, error: "No response from AI" };
        }

        return {
            success: true,
            message: message.content,
            usage: response.usage,
        };
    } catch (error: any) {
        console.error("AI chat error:", error);
        return {
            success: false,
            error: error.message || "Failed to get AI response",
        };
    }
}

export function buildSystemPrompt(userContext: {
    name: string;
    role: string;
    currentLevel?: string;
    nextLevel?: string;
    goals?: Array<{ title: string; rating?: string; evidenceCount: number }>;
    leaderboardRank?: number;
}): string {
    return `You are an AI Performance Coach for ${userContext.name}, a ${userContext.role} in a performance management system.

Current Context:
- Role: ${userContext.role}
- Current Level: ${userContext.currentLevel || "Not set"}
- Next Level: ${userContext.nextLevel || "Not set"}
- Leaderboard Rank: ${userContext.leaderboardRank ? `#${userContext.leaderboardRank}` : "Not ranked yet"}

Active Goals:
${userContext.goals
            ?.map(
                (g) =>
                    `- ${g.title} (Rating: ${g.rating || "Not rated"}, Evidence: ${g.evidenceCount} entries)`
            )
            .join("\n") || "No active goals"
        }

Your role is to:
1. Provide specific, actionable advice on improving performance
2. Help write better evidence statements with concrete metrics and impact
3. Explain what's needed to reach the next level
4. Suggest ways to improve leaderboard standing
5. Give honest, constructive feedback

Guidelines:
- Be encouraging but realistic
- Provide specific examples and templates
- Reference the user's actual goals and current status
- Suggest concrete next steps
- Keep responses concise and actionable
- Use a friendly, professional tone

When the user asks for help, provide:
1. Analysis of their current situation
2. Specific recommendations
3. Example evidence statements or actions
4. Expected impact of following your advice`;
}

export async function getCoachResponse(
    userMessage: string,
    userContext: Parameters<typeof buildSystemPrompt>[0],
    conversationHistory: ChatMessage[] = []
) {
    const systemPrompt = buildSystemPrompt(userContext);

    const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
    ];

    return chat({ messages });
}

export async function generateEvidenceSuggestion(
    goalTitle: string,
    goalDescription: string,
    role: string
) {
    const prompt = `As a performance coach, suggest 3 high-quality evidence statements for this goal:

Goal: ${goalTitle}
Description: ${goalDescription}
Role: ${role}

For each suggestion, provide:
1. A specific accomplishment or impact
2. Quantifiable metrics
3. Business value or outcome

Format each as a complete evidence statement that demonstrates clear impact.`;

    const response = await chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
    });

    return response;
}

export async function analyzeEvidence(evidenceText: string, goalTitle: string) {
    const prompt = `Analyze this evidence statement for the goal "${goalTitle}":

"${evidenceText}"

Provide:
1. Strength score (1-10)
2. What's good about it
3. What's missing
4. Specific suggestions to improve it

Be constructive and specific.`;

    const response = await chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
    });

    return response;
}

export async function generateLevelGuidance(
    currentLevel: string,
    nextLevel: string,
    role: string,
    currentPerformance: {
        goals: number;
        avgRating: string;
        evidenceCount: number;
    }
) {
    const prompt = `Provide guidance for advancing from ${currentLevel} to ${nextLevel} as a ${role}.

Current Performance:
- Active Goals: ${currentPerformance.goals}
- Average Rating: ${currentPerformance.avgRating}
- Total Evidence: ${currentPerformance.evidenceCount}

Provide:
1. Key gaps to address
2. Specific actions to take
3. Timeline expectations
4. Success indicators

Be specific and actionable.`;

    const response = await chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
    });

    return response;
}
