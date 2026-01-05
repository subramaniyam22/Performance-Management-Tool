import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRatingLabel, getRatingColor, formatDate, daysAgo } from "@/lib/utils";
import { Target, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default async function GoalsPage() {
    const session = await auth();
    if (!session?.user) return null;

    const goalAssignments = await prisma.goalAssignment.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            goal: true,
            cycle: true,
            ratings: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
            evidenceLogs: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
            _count: {
                select: { evidenceLogs: true },
            },
        },
        orderBy: [
            { status: "asc" },
            { createdAt: "desc" },
        ],
    });

    const activeGoals = goalAssignments.filter((g) => g.status === "ACTIVE");
    const completedGoals = goalAssignments.filter((g) => g.status === "COMPLETED");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Goals</h1>
                <p className="text-muted-foreground">
                    View and manage all your assigned goals across cycles
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeGoals.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedGoals.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Needs Evidence</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {activeGoals.filter((g) => g._count.evidenceLogs === 0).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Goals */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Goals</CardTitle>
                    <CardDescription>Goals currently in progress</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeGoals.length === 0 ? (
                        <EmptyState
                            icon={Target}
                            title="No active goals"
                            description="You don't have any active goals assigned yet."
                        />
                    ) : (
                        <div className="space-y-4">
                            {activeGoals.map((assignment) => {
                                const latestRating = assignment.ratings[0];
                                const lastEvidence = assignment.evidenceLogs[0];
                                const daysSinceEvidence = lastEvidence ? daysAgo(lastEvidence.createdAt) : null;
                                const needsEvidence = assignment._count.evidenceLogs === 0 || (daysSinceEvidence && daysSinceEvidence > 14);

                                return (
                                    <div
                                        key={assignment.id}
                                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{assignment.goal.title}</h4>
                                                <Badge variant="outline">{assignment.goal.weightage}%</Badge>
                                                {needsEvidence && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Evidence needed
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {assignment.goal.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {assignment.cycle.label}
                                                </span>
                                                {latestRating && (
                                                    <span className={getRatingColor(latestRating.rating)}>
                                                        {getRatingLabel(latestRating.rating)}
                                                    </span>
                                                )}
                                                <span>
                                                    Evidence: {assignment._count.evidenceLogs}
                                                    {lastEvidence && ` (${daysSinceEvidence}d ago)`}
                                                </span>
                                                {assignment.dueAt && (
                                                    <span>Due: {formatDate(assignment.dueAt)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <Link href={`/evidence/${assignment.id}`}>
                                            <Button size="sm">Add Evidence</Button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Completed Goals</CardTitle>
                        <CardDescription>Goals you've finished</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {completedGoals.map((assignment) => {
                                const latestRating = assignment.ratings[0];

                                return (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">{assignment.goal.title}</p>
                                            <p className="text-sm text-muted-foreground">{assignment.cycle.label}</p>
                                        </div>
                                        {latestRating && (
                                            <Badge className={getRatingColor(latestRating.rating)}>
                                                {getRatingLabel(latestRating.rating)}
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
