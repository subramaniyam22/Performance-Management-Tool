"use client";

import { useState, useEffect } from "react";
import { Goal } from "@prisma/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGoal, updateGoal } from "./actions";

interface GoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    goal?: Goal | null;
    onSuccess: () => void;
}

export function GoalDialog({ open, onOpenChange, goal, onSuccess }: GoalDialogProps) {
    const [title, setTitle] = useState("");
    const [weightage, setWeightage] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Update state when goal prop changes
    useEffect(() => {
        if (goal) {
            setTitle(goal.title);
            setWeightage(goal.weightage.toString());
            setDescription(goal.description);
        } else {
            setTitle("");
            setWeightage("");
            setDescription("");
        }
        setError("");
    }, [goal, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const weightageNum = parseFloat(weightage);
            if (isNaN(weightageNum) || weightageNum < 0 || weightageNum > 100) {
                setError("Weightage must be between 0 and 100");
                setLoading(false);
                return;
            }

            let result;
            if (goal) {
                result = await updateGoal(goal.id, {
                    title,
                    weightage: weightageNum,
                    description,
                });
            } else {
                result = await createGoal({
                    title,
                    weightage: weightageNum,
                    description,
                });
            }

            if (!result.success) {
                setError(result.error || "Operation failed");
                setLoading(false);
                return;
            }

            onSuccess();
            onOpenChange(false);
            setTitle("");
            setWeightage("");
            setDescription("");
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{goal ? "Edit Goal" : "Create Goal"}</DialogTitle>
                    <DialogDescription>
                        {goal ? "Update goal information" : "Create a new performance goal"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">Goal Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Improve API Performance"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="weightage">Weightage (%) *</Label>
                        <Input
                            id="weightage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={weightage}
                            onChange={(e) => setWeightage(e.target.value)}
                            placeholder="e.g., 20"
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Percentage weight of this goal (0-100). Total for a user should ideally be 100%.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this goal entails, success criteria, and expected outcomes..."
                            rows={5}
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Provide clear expectations and success criteria for this goal.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
