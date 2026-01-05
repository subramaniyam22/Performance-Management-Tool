"use client";

import { useState } from "react";
import { Goal, User, Cycle } from "@prisma/client";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { assignGoals } from "./actions";

interface AssignGoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    goal: Goal;
    users: User[];
    cycles: Cycle[];
    onSuccess: () => void;
}

export function AssignGoalDialog({
    open,
    onOpenChange,
    goal,
    users,
    cycles,
    onSuccess,
}: AssignGoalDialogProps) {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [cycleId, setCycleId] = useState("");
    const [dueAt, setDueAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAddUser = (userId: string) => {
        if (!selectedUserIds.includes(userId)) {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (selectedUserIds.length === 0) {
            setError("Please select at least one user");
            return;
        }

        if (!cycleId) {
            setError("Please select a cycle");
            return;
        }

        setLoading(true);

        const result = await assignGoals({
            goalId: goal.id,
            userIds: selectedUserIds,
            cycleId,
            dueAt: dueAt || undefined,
        });

        if (!result.success) {
            setError(result.error || "Failed to assign goals");
            setLoading(false);
            return;
        }

        onSuccess();
        onOpenChange(false);
        setSelectedUserIds([]);
        setCycleId("");
        setDueAt("");
        setLoading(false);
    };

    const availableUsers = users.filter((u) => !selectedUserIds.includes(u.id));
    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Assign Goal: {goal.title}</DialogTitle>
                    <DialogDescription>
                        Assign this goal to one or more users for a specific cycle
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Select Users *</Label>
                        <Select onValueChange={handleAddUser} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose users to assign..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedUsers.map((user) => (
                                    <Badge key={user.id} variant="secondary" className="gap-1">
                                        {user.name}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(user.id)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Selected: {selectedUserIds.length} user(s)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cycle">Cycle *</Label>
                        <Select value={cycleId} onValueChange={setCycleId} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select cycle..." />
                            </SelectTrigger>
                            <SelectContent>
                                {cycles.map((cycle) => (
                                    <SelectItem key={cycle.id} value={cycle.id}>
                                        {cycle.label} ({cycle.type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueAt">Due Date (Optional)</Label>
                        <Input
                            id="dueAt"
                            type="date"
                            value={dueAt}
                            onChange={(e) => setDueAt(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                            <strong>Goal:</strong> {goal.title}
                        </p>
                        <p className="text-sm text-blue-800">
                            <strong>Weightage:</strong> {goal.weightage}%
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Assigning..." : `Assign to ${selectedUserIds.length} User(s)`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
