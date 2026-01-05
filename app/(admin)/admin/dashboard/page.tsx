import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, TrendingDown, AlertTriangle, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { daysAgo } from "@/lib/utils";

export default async function AdminDashboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    // Fetch overview metrics
    const [totalUsers, activeUsers, inactiveUsers, totalGoals, activeGoalAssignments] =
        await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: "ACTIVE" } }),
            prisma.user.count({ where: { status: "INACTIVE" } }),
            prisma.goal.count({ where: { isActive: true } }),
            prisma.goalAssignment.count({ where: { status: "ACTIVE" } }),
        ]);

    // Find goals with no evidence in 14 days
    const assignmentsWithoutRecentEvidence = await prisma.goalAssignment.findMany({
        where: {
            status: "ACTIVE",
            OR: [
                {
                    evidenceLogs: {
                        none: {},
                    },
                },
                {
                    evidenceLogs: {
                        every: {
                            createdAt: {
                                lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                            },
                        },
                    },
                },
            ],
        },
        include: {
            user: true,
            goal: true,
            evidenceLogs: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
        take: 10,
    });

    // Recent rating activity
    const recentRatings = await prisma.ratingEvent.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            goalAssignment: {
                include: {
                    user: true,
                    goal: true,
                },
            },
            ratedBy: true,
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of performance management across the organization
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeUsers} active, {inactiveUsers} inactive
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalGoals}</div>
                        <p className="text-xs text-muted-foreground">{activeGoalAssignments} assignments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignmentsWithoutRecentEvidence.length}</div>
                        <p className="text-xs text-muted-foreground">Goals without recent evidence</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Ratings</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recentRatings.length}</div>
                        <p className="text-xs text-muted-foreground">This week</p>
                    </CardContent>
                </Card>
            </div>

            {/* At-Risk Goals */}
            <Card>
                <CardHeader>
                    <CardTitle>Goals Needing Attention</CardTitle>
                    <CardDescription>
                        Goals with no evidence in the last 14 days or no evidence at all
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {assignmentsWithoutRecentEvidence.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">
                            All goals have recent evidence. Great job!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {assignmentsWithoutRecentEvidence.map((assignment) => {
                                const lastEvidence = assignment.evidenceLogs[0];
                                const daysSinceEvidence = lastEvidence
                                    ? daysAgo(lastEvidence.createdAt)
                                    : null;

                                return (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium">{assignment.goal.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Assigned to: {assignment.user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {daysSinceEvidence !== null
                                                    ? `Last evidence: ${daysSinceEvidence} days ago`
                                                    : "No evidence yet"}
                                            </p>
                                        </div>
                                        <Link href={`/admin/users?userId=${assignment.user.id}`}>
                                            <Button size="sm" variant="outline">
                                                View User
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
            <div className="grid gap-4 md:grid-cols-4">
                <Link href="/admin/users">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">Manage Users</CardTitle>
                            <CardDescription>Add, edit, or deactivate users</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin/teams">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">Manage Teams</CardTitle>
                            <CardDescription>Create and organize teams</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin/goals">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">Manage Goals</CardTitle>
                            <CardDescription>Create and assign goals</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin/ratings">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">Submit Ratings</CardTitle>
                            <CardDescription>Rate team member performance</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
