import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCoachResponse } from "@/lib/ai";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, conversationHistory } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        // Get user context for AI
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

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const levelSnapshot = user.levelSnapshots[0];

        // Calculate leaderboard rank
        const allUsers = await prisma.user.findMany({
            where: {
                role: user.role,
                status: "ACTIVE",
            },
            include: {
                goalAssignments: {
                    where: { status: "ACTIVE" },
                    include: {
                        goal: true,
                        ratings: true,
                        evidenceLogs: true,
                    },
                },
            },
        });

        const { calculateUserScore } = await import("@/lib/scoring");
        const scores = allUsers.map((u) => {
            const goals = u.goalAssignments.map((ga) => ({
                goalId: ga.goalId,
                goalTitle: ga.goal.title,
                weightage: ga.goal.weightage,
                rating: ga.ratings[0]?.rating,
                lastEvidenceDate: ga.evidenceLogs[0]?.createdAt,
                evidenceCount: ga.evidenceLogs.length,
                hasMetrics: ga.evidenceLogs.some((e) => /\d+/.test(e.text)),
                hasLinks: ga.evidenceLogs.some((e) => e.links && e.links.length > 0),
            }));

            const ratingHistory = u.goalAssignments.flatMap((ga) =>
                ga.ratings.map((r) => ({ rating: r.rating, createdAt: r.createdAt }))
            );

            return {
                userId: u.id,
                score: calculateUserScore(goals, ratingHistory).totalScore,
            };
        });
        scores.sort((a, b) => b.score - a.score);
        const rank = scores.findIndex((s) => s.userId === user.id) + 1;

        // Build context
        const userContext = {
            name: user.name,
            role: user.role,
            currentLevel: levelSnapshot?.currentLevel,
            nextLevel: levelSnapshot?.nextLevel,
            goals: user.goalAssignments.map((ga) => ({
                title: ga.goal.title,
                rating: ga.ratings[0]?.rating,
                evidenceCount: ga._count.evidenceLogs,
            })),
            leaderboardRank: rank,
        };

        // Get AI response
        const response = await getCoachResponse(
            message,
            userContext,
            conversationHistory || []
        );

        if (!response.success) {
            return NextResponse.json(
                { error: response.error || "AI response failed" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: response.message,
            usage: response.usage,
        });
    } catch (error) {
        console.error("AI coach error:", error);
        return NextResponse.json(
            { error: "Failed to get coach response" },
            { status: 500 }
        );
    }
}
