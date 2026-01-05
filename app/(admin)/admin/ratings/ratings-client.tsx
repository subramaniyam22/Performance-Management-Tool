"use client";

import { useState } from "react";
import { GoalAssignment, User, Goal, Cycle, RatingEvent, EvidenceLog, Rating } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2, AlertCircle, Lock, Unlock } from "lucide-react";
import { getRatingLabel, getRatingColor, formatDate, daysAgo } from "@/lib/utils";
import { submitRating, approveRating, requestRatingChange } from "./actions";
import { ChangeRequestDialog } from "./change-request-dialog";

type AssignmentWithDetails = GoalAssignment & {
    user: User;
    goal: Goal;
    cycle: Cycle;
    ratings: (RatingEvent & { ratedBy: User })[];
    evidenceLogs: EvidenceLog[];
    _count: { evidenceLogs: number };
};

interface RatingsClientProps {
    assignments: AssignmentWithDetails[];
    currentUserRole?: string;
}

export function RatingsClient({ assignments, currentUserRole }: RatingsClientProps) {
    const [search, setSearch] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string>("all");
    const [ratings, setRatings] = useState<Record<string, { rating: Rating; notes: string }>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [success, setSuccess] = useState<Record<string, boolean>>({});
    const [changeRequestDialog, setChangeRequestDialog] = useState<{ open: boolean; ratingEventId: string | null }>({ open: false, ratingEventId: null });

    const isSupervisor = currentUserRole === "SUPERVISOR";
    const isAdmin = currentUserRole === "ADMIN";

    // Get unique users
    const users = Array.from(
        new Map(assignments.map((a) => [a.user.id, a.user])).values()
    );

    // Filter assignments
    const filteredAssignments = assignments.filter((assignment) => {
        const matchesSearch =
            assignment.user.name.toLowerCase().includes(search.toLowerCase()) ||
            assignment.goal.title.toLowerCase().includes(search.toLowerCase());
        const matchesUser = selectedUserId === "all" || !selectedUserId || assignment.userId === selectedUserId;
        return matchesSearch && matchesUser;
    });

    // Group by user
    const assignmentsByUser = filteredAssignments.reduce((acc, assignment) => {
        if (!acc[assignment.userId]) {
            acc[assignment.userId] = [];
        }
        acc[assignment.userId].push(assignment);
        return acc;
    }, {} as Record<string, AssignmentWithDetails[]>);

    const handleRatingChange = (assignmentId: string, rating: Rating) => {
        setRatings({
            ...ratings,
            [assignmentId]: {
                rating,
                notes: ratings[assignmentId]?.notes || "",
            },
        });
    };

    const handleNotesChange = (assignmentId: string, notes: string) => {
        setRatings({
            ...ratings,
            [assignmentId]: {
                rating: ratings[assignmentId]?.rating || "MEETS_EXPECTATIONS",
                notes,
            },
        });
    };

    const handleSubmit = async (assignmentId: string) => {
        const ratingData = ratings[assignmentId];
        if (!ratingData) return;

        setLoading({ ...loading, [assignmentId]: true });

        const result = await submitRating({
            goalAssignmentId: assignmentId,
            rating: ratingData.rating,
            notes: ratingData.notes,
        });

        setLoading({ ...loading, [assignmentId]: false });

        if (result.success) {
            setSuccess({ ...success, [assignmentId]: true });
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert(result.error);
        }
    };

    const handleApprove = async (ratingEventId: string) => {
        const result = await approveRating(ratingEventId);
        if (result.success) {
            window.location.reload();
        }
    };

    const handleRequestChange = (ratingEventId: string) => {
        setChangeRequestDialog({ open: true, ratingEventId });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users or goals..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filter by user..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="by-user">
                <TabsList>
                    <TabsTrigger value="by-user">By User</TabsTrigger>
                    <TabsTrigger value="all">All Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="by-user" className="space-y-4">
                    {Object.entries(assignmentsByUser).map(([userId, userAssignments]) => {
                        const user = userAssignments[0].user;
                        return (
                            <Card key={userId}>
                                <CardHeader>
                                    <CardTitle>{user.name}</CardTitle>
                                    <CardDescription>
                                        {user.email} • {userAssignments.length} active goal(s)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {userAssignments.map((assignment) => {
                                        const latestRating = assignment.ratings[0];
                                        const lastEvidence = assignment.evidenceLogs[0];
                                        const daysSinceEvidence = lastEvidence
                                            ? daysAgo(lastEvidence.createdAt)
                                            : null;
                                        const hasSubmitted = success[assignment.id];

                                        return (
                                            <div
                                                key={assignment.id}
                                                className="p-4 border rounded-lg space-y-3"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold">{assignment.goal.title}</h4>
                                                            <Badge variant="outline">{assignment.goal.weightage}%</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {assignment.goal.description}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                            <span>{assignment.cycle.label}</span>
                                                            <span>
                                                                Evidence: {assignment._count.evidenceLogs}
                                                                {daysSinceEvidence !== null && ` (${daysSinceEvidence}d ago)`}
                                                            </span>
                                                            {latestRating && (
                                                                <span className={getRatingColor(latestRating.rating)}>
                                                                    Current: {getRatingLabel(latestRating.rating)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Evidence Preview */}
                                                {lastEvidence && (
                                                    <div className="p-3 bg-gray-50 rounded-md">
                                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                                            Latest Evidence ({formatDate(lastEvidence.createdAt)}):
                                                        </p>
                                                        <p className="text-sm line-clamp-2">{lastEvidence.text}</p>
                                                    </div>
                                                )}

                                                {/* Rating Form */}
                                                <div className="grid gap-3 pt-2 border-t">
                                                    {/* Show approval status if rating exists */}
                                                    {latestRating && (
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {latestRating.isApproved ? (
                                                                <Badge variant="secondary" className="gap-1">
                                                                    <Lock className="h-3 w-3" />
                                                                    Approved & Locked
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="gap-1">
                                                                    <Unlock className="h-3 w-3" />
                                                                    Not Approved
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label>Rating</Label>
                                                            <Select
                                                                value={ratings[assignment.id]?.rating}
                                                                onValueChange={(value) =>
                                                                    handleRatingChange(assignment.id, value as Rating)
                                                                }
                                                                disabled={latestRating?.isApproved && !isAdmin}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select rating..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="OUTSTANDING">
                                                                        Outstanding
                                                                    </SelectItem>
                                                                    <SelectItem value="EXCEEDS_EXPECTATIONS">
                                                                        Exceeds Expectations
                                                                    </SelectItem>
                                                                    <SelectItem value="MEETS_EXPECTATIONS">
                                                                        Meets Expectations
                                                                    </SelectItem>
                                                                    <SelectItem value="IMPROVEMENT_NEEDED">
                                                                        Improvement Needed
                                                                    </SelectItem>
                                                                    <SelectItem value="DOES_NOT_MEET">
                                                                        Does Not Meet
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="flex items-end gap-2">
                                                            <Button
                                                                onClick={() => handleSubmit(assignment.id)}
                                                                disabled={
                                                                    !ratings[assignment.id]?.rating ||
                                                                    loading[assignment.id] ||
                                                                    hasSubmitted ||
                                                                    (latestRating?.isApproved && !isAdmin)
                                                                }
                                                                className="flex-1"
                                                            >
                                                                {hasSubmitted ? (
                                                                    <>
                                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                        Submitted
                                                                    </>
                                                                ) : loading[assignment.id] ? (
                                                                    "Submitting..."
                                                                ) : (
                                                                    "Submit Rating"
                                                                )}
                                                            </Button>

                                                            {/* Approval buttons */}
                                                            {latestRating && !latestRating.isApproved && isSupervisor && (
                                                                <Button
                                                                    onClick={() => handleApprove(latestRating.id)}
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    <Lock className="h-4 w-4 mr-2" />
                                                                    Approve
                                                                </Button>
                                                            )}

                                                            {latestRating && latestRating.isApproved && isSupervisor && (
                                                                <Button
                                                                    onClick={() => handleRequestChange(latestRating.id)}
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    Request Change
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Notes (Optional)</Label>
                                                        <Textarea
                                                            value={ratings[assignment.id]?.notes || ""}
                                                            onChange={(e) =>
                                                                handleNotesChange(assignment.id, e.target.value)
                                                            }
                                                            placeholder="Add feedback or comments about this rating..."
                                                            rows={2}
                                                            disabled={latestRating?.isApproved && !isAdmin}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}

                    {Object.keys(assignmentsByUser).length === 0 && (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No assignments found
                            </CardContent>
                        </Card>
                    )}

                    {/* Change Request Dialog */}
                    <ChangeRequestDialog
                        open={changeRequestDialog.open}
                        onOpenChange={(open) => setChangeRequestDialog({ ...changeRequestDialog, open })}
                        ratingEventId={changeRequestDialog.ratingEventId || ""}
                        onSuccess={() => window.location.reload()}
                    />
                </TabsContent>

                <TabsContent value="all" className="space-y-3">
                    {filteredAssignments.map((assignment) => {
                        const latestRating = assignment.ratings[0];
                        const hasSubmitted = success[assignment.id];

                        return (
                            <Card key={assignment.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold">{assignment.user.name}</p>
                                            <p className="text-sm text-muted-foreground">{assignment.goal.title}</p>
                                            {latestRating && (
                                                <Badge className={`mt-1 ${getRatingColor(latestRating.rating)}`}>
                                                    Current: {getRatingLabel(latestRating.rating)}
                                                </Badge>
                                            )}
                                        </div>
                                        <Badge variant="outline">{assignment.goal.weightage}%</Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-1">
                                            <Label>Rating</Label>
                                            <Select
                                                value={ratings[assignment.id]?.rating}
                                                onValueChange={(value) =>
                                                    handleRatingChange(assignment.id, value as Rating)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="OUTSTANDING">Outstanding</SelectItem>
                                                    <SelectItem value="EXCEEDS_EXPECTATIONS">Exceeds Expectations</SelectItem>
                                                    <SelectItem value="MEETS_EXPECTATIONS">Meets Expectations</SelectItem>
                                                    <SelectItem value="IMPROVEMENT_NEEDED">Improvement Needed</SelectItem>
                                                    <SelectItem value="DOES_NOT_MEET">Does Not Meet</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="col-span-2 flex items-end">
                                            <Button
                                                onClick={() => handleSubmit(assignment.id)}
                                                disabled={
                                                    !ratings[assignment.id]?.rating ||
                                                    loading[assignment.id] ||
                                                    hasSubmitted
                                                }
                                                className="w-full"
                                            >
                                                {hasSubmitted ? "Submitted ✓" : "Submit"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>
            </Tabs>
        </div>
    );
}
