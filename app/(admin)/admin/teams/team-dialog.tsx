"use client";

import { useState, useEffect } from "react";
import { Team, User, TeamMember } from "@prisma/client";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { createTeam, updateTeam } from "./actions";

type TeamWithMembers = Team & {
    members: (TeamMember & { user: User })[];
};

interface TeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team?: TeamWithMembers | null;
    users: User[];
    onSuccess: () => void;
}

export function TeamDialog({ open, onOpenChange, team, users, onSuccess }: TeamDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Update state when team prop changes
    useEffect(() => {
        if (team) {
            setName(team.name);
            setDescription(team.description || "");
            setSelectedUserIds(team.members.map((m) => m.userId));
        } else {
            setName("");
            setDescription("");
            setSelectedUserIds([]);
        }
        setError("");
    }, [team, open]);

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
        setLoading(true);

        try {
            let result;
            if (team) {
                result = await updateTeam(team.id, {
                    name,
                    description,
                    memberIds: selectedUserIds,
                });
            } else {
                result = await createTeam({
                    name,
                    description,
                    memberIds: selectedUserIds,
                });
            }

            if (!result.success) {
                setError(result.error || "Operation failed");
                setLoading(false);
                return;
            }

            onSuccess();
            onOpenChange(false);
            setName("");
            setDescription("");
            setSelectedUserIds([]);
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const availableUsers = users.filter((u) => !selectedUserIds.includes(u.id));
    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{team ? "Edit Team" : "Create Team"}</DialogTitle>
                    <DialogDescription>
                        {team ? "Update team information and members" : "Create a new team"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Team Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Engineering Team"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the team's purpose and responsibilities..."
                            rows={3}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Team Members</Label>
                        <Select onValueChange={handleAddUser} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Add members..." />
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
                            {selectedUserIds.length} member(s) selected
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : team ? "Update Team" : "Create Team"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
