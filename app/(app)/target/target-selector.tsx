"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Rating } from "@prisma/client";

type TargetRating = "MEETS_EXPECTATIONS" | "EXCEEDS_EXPECTATIONS" | "OUTSTANDING";

interface TargetSelectorProps {
    initialTarget?: Rating | null;
}

export function TargetSelector({ initialTarget }: TargetSelectorProps) {
    const [selectedRating, setSelectedRating] = useState<TargetRating | null>(
        initialTarget && ["MEETS_EXPECTATIONS", "EXCEEDS_EXPECTATIONS", "OUTSTANDING"].includes(initialTarget)
            ? (initialTarget as TargetRating)
            : null
    );
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const router = useRouter();

    const ratings = [
        {
            value: "OUTSTANDING" as TargetRating,
            label: "Outstanding",
            description: "Consistently delivers exceptional, innovative results",
            colorClass: "purple",
            borderColor: "border-purple-600",
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
        },
        {
            value: "EXCEEDS_EXPECTATIONS" as TargetRating,
            label: "Exceeds Expectations",
            description: "Consistently delivers exceptional results",
            colorClass: "green",
            borderColor: "border-green-600",
            bgColor: "bg-green-50",
            textColor: "text-green-600",
        },
        {
            value: "MEETS_EXPECTATIONS" as TargetRating,
            label: "Meets Expectations",
            description: "Consistently meets all requirements",
            colorClass: "blue",
            borderColor: "border-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
    ];

    const handleSave = async () => {
        if (!selectedRating) return;

        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch("/api/target-rating", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetRating: selectedRating }),
            });

            if (!response.ok) {
                throw new Error("Failed to save");
            }

            setMessage({ type: "success", text: "Target rating saved successfully!" });
            router.refresh();
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save target rating. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-3">
                {ratings.map((rating) => {
                    const isSelected = selectedRating === rating.value;
                    return (
                        <button
                            key={rating.value}
                            onClick={() => setSelectedRating(rating.value)}
                            className={`p-4 border-2 rounded-lg transition-all text-left ${isSelected
                                    ? `${rating.borderColor} ${rating.bgColor}`
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold">{rating.label}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {rating.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <CheckCircle2 className={`h-6 w-6 ${rating.textColor}`} />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {message && (
                <div
                    className={`p-3 rounded-lg text-sm ${message.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                >
                    {message.text}
                </div>
            )}

            <Button
                onClick={handleSave}
                disabled={!selectedRating || saving}
                className="w-full"
            >
                {saving ? "Saving..." : "Save Target"}
            </Button>
        </div>
    );
}
