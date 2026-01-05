import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { getRatingLabel } from "@/lib/utils";
import Link from "next/link";
import { TargetSelector } from "./target-selector";

export default async function TargetPage() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            goalAssignments: {
                where: { status: "ACTIVE" },
                include: {
                    goal: true,
                    ratings: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                    evidenceLogs: {
                        orderBy: { createdAt: "desc" },
                    },
                    _count: {
                        select: { evidenceLogs: true },
                    },
                },
            },
            levelSnapshots: {
                orderBy: { computedAt: "desc" },
                take: 1,
            },
        },
    });

    if (!user) return null;

    const levelSnapshot = user.levelSnapshots[0];

    // Calculate current average rating
    const ratingsData = user.goalAssignments
        .map((ga) => ga.ratings[0])
        .filter((r) => r);

    const avgRating =
        ratingsData.length > 0
            ? ratingsData.reduce((sum, r) => {
                const score =
                    r.rating === "OUTSTANDING"
                        ? 5
                        : r.rating === "EXCEEDS_EXPECTATIONS"
                            ? 4
                            : r.rating === "MEETS_EXPECTATIONS"
                                ? 3
                                : r.rating === "IMPROVEMENT_NEEDED"
                                    ? 2
                                    : 1;
                return sum + score;
            }, 0) / ratingsData.length
            : 0;

    const currentRatingLabel =
        avgRating >= 3.5
            ? "Exceeds Expectations"
            : avgRating >= 2.5
                ? "Meets Expectations"
                : avgRating >= 1.5
                    ? "Below Expectations"
                    : "Needs Improvement";

    // Gap analysis
    const goalsWithoutEvidence = user.goalAssignments.filter(
        (ga) => ga._count.evidenceLogs === 0
    );

    const goalsWithoutRating = user.goalAssignments.filter(
        (ga) => ga.ratings.length === 0
    );

    const lowEvidenceGoals = user.goalAssignments.filter(
        (ga) => ga._count.evidenceLogs > 0 && ga._count.evidenceLogs < 3
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Target Rating Chase</h1>
                <p className="text-muted-foreground">
                    Set your performance goals and get a personalized action plan
                </p>
            </div>

            {/* Current Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Current Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Current Rating</p>
                            <p className="text-2xl font-bold">{currentRatingLabel}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Active Goals</p>
                            <p className="text-2xl font-bold">{user.goalAssignments.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Level</p>
                            <p className="text-2xl font-bold">{levelSnapshot?.currentLevel || "Not set"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Target Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-600" />
                        Set Your Target
                    </CardTitle>
                    <CardDescription>Choose the rating you want to achieve</CardDescription>
                </CardHeader>
                <CardContent>
                    <TargetSelector initialTarget={user.targetRating} />
                </CardContent>
            </Card>

            {/* Gap Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        Gap Analysis
                    </CardTitle>
                    <CardDescription>What you need to work on</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {goalsWithoutEvidence.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-red-900">
                                        {goalsWithoutEvidence.length} goal(s) without evidence
                                    </h4>
                                    <ul className="mt-2 space-y-1">
                                        {goalsWithoutEvidence.map((ga) => (
                                            <li key={ga.id} className="text-sm text-red-800">
                                                • {ga.goal.title}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-sm text-red-800 mt-2">
                                        <strong>Action:</strong> Add evidence to demonstrate your impact
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {lowEvidenceGoals.length > 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-yellow-900">
                                        {lowEvidenceGoals.length} goal(s) with limited evidence
                                    </h4>
                                    <ul className="mt-2 space-y-1">
                                        {lowEvidenceGoals.map((ga) => (
                                            <li key={ga.id} className="text-sm text-yellow-800">
                                                • {ga.goal.title} ({ga._count.evidenceLogs} evidence entries)
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-sm text-yellow-800 mt-2">
                                        <strong>Action:</strong> Add more evidence with metrics and links
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {goalsWithoutEvidence.length === 0 && lowEvidenceGoals.length === 0 && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-green-900">Great job!</h4>
                                    <p className="text-sm text-green-800">
                                        All your goals have sufficient evidence. Keep it up!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Plan */}
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Action Plan</CardTitle>
                    <CardDescription>Specific steps to reach your target</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                1
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">Add Evidence to All Goals</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ensure every goal has at least 3 evidence entries with metrics and links
                                </p>
                                <Link href="/goals">
                                    <Button size="sm" variant="outline" className="mt-2">
                                        Go to Goals
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                2
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">Include Quantifiable Metrics</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Use numbers, percentages, and measurable outcomes in your evidence
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                3
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">Get AI Coach Feedback</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ask the AI Coach to review your evidence and suggest improvements
                                </p>
                                <Link href="/coach">
                                    <Button size="sm" variant="outline" className="mt-2">
                                        Talk to Coach
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Role-Specific Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Impact Statement Examples for {user.role}</CardTitle>
                    <CardDescription>High-quality evidence examples</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium mb-1">Example 1:</p>
                            <p className="text-muted-foreground">
                                "Optimized database queries reducing API response time from 450ms to 180ms (60%
                                improvement). Deployed to production serving 10K+ daily users. Grafana dashboard
                                shows consistent performance gains over 2 weeks."
                            </p>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium mb-1">Example 2:</p>
                            <p className="text-muted-foreground">
                                "Led code review initiative increasing test coverage from 45% to 78%. Identified
                                and fixed 23 critical bugs before production. Team velocity improved by 15% as
                                measured in JIRA."
                            </p>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium mb-1">Example 3:</p>
                            <p className="text-muted-foreground">
                                "Mentored 2 junior developers, conducting weekly 1-on-1s and pair programming
                                sessions. Both team members successfully delivered features independently within 6
                                weeks. Positive feedback received in team retrospective."
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
