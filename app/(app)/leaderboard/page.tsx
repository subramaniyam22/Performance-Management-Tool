import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calculateUserScore, GoalWithRating, RatingHistory } from "@/lib/scoring";
import { getRoleLabel, formatScore } from "@/lib/utils";

export default async function LeaderboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    // Fetch all active users with their goal assignments
    const users = await prisma.user.findMany({
        where: {
            status: "ACTIVE",
            role: session.user.role, // Same role comparison
        },
        include: {
            goalAssignments: {
                where: {
                    status: "ACTIVE",
                },
                include: {
                    goal: true,
                    ratings: {
                        orderBy: { createdAt: "desc" },
                    },
                    evidenceLogs: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            },
        },
    });

    // Calculate scores for each user
    const userScores = users.map((user) => {
        const goals: GoalWithRating[] = user.goalAssignments.map((assignment) => {
            const latestRating = assignment.ratings[0];
            const lastEvidence = assignment.evidenceLogs[0];

            // Check for metrics and links in evidence
            const hasMetrics = assignment.evidenceLogs.some((e) =>
                /\d+%|\d+x|\d+ (users|requests|ms|seconds|minutes)/.test(e.text)
            );
            const hasLinks = assignment.evidenceLogs.some((e) => e.links.length > 0);

            return {
                goalId: assignment.goalId,
                goalTitle: assignment.goal.title,
                weightage: assignment.goal.weightage,
                rating: latestRating?.rating,
                lastEvidenceDate: lastEvidence?.createdAt,
                evidenceCount: assignment.evidenceLogs.length,
                hasMetrics,
                hasLinks,
            };
        });

        const ratingHistory: RatingHistory[] = user.goalAssignments.flatMap((assignment) =>
            assignment.ratings.map((r) => ({
                rating: r.rating,
                createdAt: r.createdAt,
            }))
        );

        const scoreBreakdown = calculateUserScore(goals, ratingHistory);

        return {
            user,
            scoreBreakdown,
        };
    });

    // Sort by total score
    const sortedUsers = userScores.sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore);

    // Find current user's rank
    const currentUserRank = sortedUsers.findIndex((u) => u.user.id === session.user.id) + 1;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getTrendIcon = (direction: string) => {
        if (direction === "improving") return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (direction === "declining") return <TrendingDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
                <p className="text-muted-foreground">
                    Performance ranking among {getRoleLabel(session.user.role)} team members
                </p>
            </div>

            {/* Current User Rank */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-blue-600" />
                        Your Ranking
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                        #{currentUserRank} of {sortedUsers.length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Score: {formatScore(sortedUsers[currentUserRank - 1]?.scoreBreakdown.totalScore || 0)}
                    </p>
                </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle>Rankings</CardTitle>
                    <CardDescription>
                        Fair comparison based on goals, evidence quality, and rating trends
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sortedUsers.map((item, index) => {
                            const isCurrentUser = item.user.id === session.user.id;
                            const rank = index + 1;

                            return (
                                <div
                                    key={item.user.id}
                                    className={`flex items-center justify-between p-4 border rounded-lg ${isCurrentUser ? "bg-blue-50 border-blue-200" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="text-2xl font-bold text-muted-foreground w-8">
                                            {rank <= 3 ? (
                                                <Trophy
                                                    className={`h-6 w-6 ${rank === 1
                                                            ? "text-yellow-500"
                                                            : rank === 2
                                                                ? "text-gray-400"
                                                                : "text-amber-600"
                                                        }`}
                                                />
                                            ) : (
                                                `#${rank}`
                                            )}
                                        </div>

                                        <Avatar>
                                            <AvatarImage src={item.user.photoUrl || undefined} />
                                            <AvatarFallback>{getInitials(item.user.name)}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{item.user.name}</p>
                                                {isCurrentUser && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        You
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{item.scoreBreakdown.topReason}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">
                                                {formatScore(item.scoreBreakdown.totalScore)}
                                            </div>
                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                <div>Goals: {formatScore(item.scoreBreakdown.goalScore)}</div>
                                                <div>Evidence: {formatScore(item.scoreBreakdown.evidenceScore)}</div>
                                                <div className="flex items-center gap-1">
                                                    Trend: {formatScore(Math.abs(item.scoreBreakdown.trendAdjustment))}
                                                    {getTrendIcon(item.scoreBreakdown.breakdown.trend.direction)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Scoring Explanation */}
            <Card>
                <CardHeader>
                    <CardTitle>How Scoring Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <p className="font-semibold">Goal Score (0-1.0)</p>
                        <p className="text-muted-foreground">
                            Weighted average of your ratings. Higher ratings and higher weightage goals contribute more.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">Evidence Score (0-0.2)</p>
                        <p className="text-muted-foreground">
                            Based on recency (40%), completeness (30%), and quality (30%) of your evidence logs.
                            Quality includes metrics and links.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">Trend Adjustment (±0.1)</p>
                        <p className="text-muted-foreground">
                            Bonus for improving rating trends, penalty for declining trends.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
