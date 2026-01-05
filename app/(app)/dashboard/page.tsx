import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRatingLabel, getRatingColor, formatDate } from "@/lib/utils";
import { Target, TrendingUp, Award, AlertCircle, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    // Fetch user's goal assignments with latest ratings
    const goalAssignments = await prisma.goalAssignment.findMany({
        where: {
            userId: session.user.id,
            status: "ACTIVE",
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
        orderBy: {
            createdAt: "desc",
        },
    });

    // Fetch user's level snapshot
    const levelSnapshot = await prisma.userLevelSnapshot.findFirst({
        where: { userId: session.user.id },
        orderBy: { computedAt: "desc" },
    });

    // Calculate total weightage
    const totalWeightage = goalAssignments.reduce((sum, ga) => sum + ga.goal.weightage, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session.user.name}!</h1>
                <p className="text-muted-foreground">
                    Here's an overview of your performance and goals
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{goalAssignments.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Total weightage: {totalWeightage.toFixed(0)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {levelSnapshot?.currentLevel || "Not set"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Next: {levelSnapshot?.nextLevel || "N/A"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tenure to Next Level</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {levelSnapshot?.tenureMonths ? `${levelSnapshot.tenureMonths}mo` : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">Estimated timeline</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {goalAssignments.filter((ga) => ga._count.evidenceLogs === 0).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Goals without evidence</p>
                    </CardContent>
                </Card>
            </div>

            {/* Goals List */}
            <Card>
                <CardHeader>
                    <CardTitle>My Goals</CardTitle>
                    <CardDescription>Track your assigned goals and their current status</CardDescription>
                </CardHeader>
                <CardContent>
                    {goalAssignments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No active goals assigned yet.</p>
                            <p className="text-sm mt-2">Contact your manager to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {goalAssignments.map((assignment) => {
                                const latestRating = assignment.ratings[0];
                                const lastEvidence = assignment.evidenceLogs[0];
                                const needsEvidence = assignment._count.evidenceLogs === 0;

                                return (
                                    <div
                                        key={assignment.id}
                                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{assignment.goal.title}</h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {assignment.goal.weightage}%
                                                </Badge>
                                                {needsEvidence && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        No evidence
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {assignment.goal.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Cycle: {assignment.cycle.label}</span>
                                                {latestRating && (
                                                    <span className={getRatingColor(latestRating.rating)}>
                                                        Rating: {getRatingLabel(latestRating.rating)}
                                                    </span>
                                                )}
                                                {lastEvidence && (
                                                    <span>Last evidence: {formatDate(lastEvidence.createdAt)}</span>
                                                )}
                                                {assignment.dueAt && (
                                                    <span>Due: {formatDate(assignment.dueAt)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <Link href={`/evidence/${assignment.id}`}>
                                            <Button size="sm" variant="outline">
                                                Add Evidence
                                            </Button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/leaderboard">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                View Leaderboard
                            </CardTitle>
                            <CardDescription>See where you stand among your peers</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/target">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Set Target Rating
                            </CardTitle>
                            <CardDescription>Define your performance goals</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href="/coach">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                AI Coach
                            </CardTitle>
                            <CardDescription>Get personalized performance advice</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
