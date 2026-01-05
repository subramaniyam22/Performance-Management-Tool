"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Send, Bot, User } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function CoachPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch("/api/ai/coach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: messages,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to get response");
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.message },
            ]);
        } catch (error) {
            console.error("Coach error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const suggestedQuestions = [
        "How can I improve my performance rating?",
        "What should I include in my evidence?",
        "How do I reach the next level?",
        "Why is my leaderboard ranking lower?",
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
                <p className="text-muted-foreground">
                    Get personalized performance advice powered by AI
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-purple-600" />
                        Your Personal Performance Coach
                    </CardTitle>
                    <CardDescription>
                        Ask me anything about improving your performance, writing better evidence, or
                        advancing your career
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Messages */}
                    <div className="space-y-4 mb-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                        {messages.length === 0 ? (
                            <div className="text-center py-12">
                                <Bot className="h-16 w-16 mx-auto text-purple-600 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    Hi! I'm your AI Performance Coach
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    I can help you improve your performance, write better evidence, and reach
                                    your goals. Try asking me a question below!
                                </p>

                                <div className="grid gap-2 max-w-md mx-auto">
                                    <p className="text-sm font-medium text-left">Suggested questions:</p>
                                    {suggestedQuestions.map((question, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(question)}
                                            className="text-left text-sm p-3 rounded-lg border hover:bg-accent transition-colors"
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((message, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    {message.role === "assistant" && (
                                        <Avatar className="h-8 w-8 bg-purple-100">
                                            <AvatarFallback>
                                                <Bot className="h-4 w-4 text-purple-600" />
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div
                                        className={`rounded-lg p-4 max-w-[80%] ${message.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>

                                    {message.role === "user" && (
                                        <Avatar className="h-8 w-8 bg-blue-100">
                                            <AvatarFallback>
                                                <User className="h-4 w-4 text-blue-600" />
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))
                        )}

                        {loading && (
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 bg-purple-100">
                                    <AvatarFallback>
                                        <Bot className="h-4 w-4 text-purple-600" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="rounded-lg p-4 bg-muted">
                                    <LoadingSpinner size="sm" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about your performance..."
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>

                    <p className="text-xs text-muted-foreground mt-2">
                        💡 Tip: Be specific in your questions for better advice. I have access to your
                        current goals, ratings, and performance data.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
