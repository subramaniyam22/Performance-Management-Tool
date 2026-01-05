#!/usr/bin/env ts-node

/**
 * Weekly Summary Job
 * 
 * Runs weekly to send performance summaries to users
 * 
 * Usage: npm run jobs:weekly
 */

import { prisma } from "../lib/prisma";
import { sendWeeklySummaryEmail } from "../lib/email";
import { calculateUserScore } from "../lib/scoring";
import { isWithinQuietHours } from "../lib/utils";

async function generateWeeklySummaries() {
    console.log("Starting weekly summary generation...");

    const users = await prisma.user.findMany({
        where: {
            status: "ACTIVE",
            role: { not: "ADMIN" },
        },
        include: {
            notificationPreferences: true,
            goalAssignments: {
                where: { status: "ACTIVE" },
                include: {
                    goal: true,
                    ratings: true,
                    evidenceLogs: {
                        where: {
                            createdAt: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                            },
                        },
                    },
                },
            },
        },
    });

    console.log(`Processing ${users.length} users...`);

    for (const user of users) {
        try {
            const prefs = user.notificationPreferences;
            const emailEnabled = prefs?.emailEnabled !== false;

            if (!emailEnabled) {
                console.log(`Skipping ${user.name} - emails disabled`);
                continue;
            }

            // Skip if in quiet hours
            if (
                prefs &&
                prefs.quietHoursStart !== null &&
                prefs.quietHoursEnd !== null &&
                isWithinQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)
            ) {
                console.log(`Skipping ${user.name} - in quiet hours`);
                continue;
            }

            // Calculate stats
            const activeGoals = user.goalAssignments.length;
            const evidenceAdded = user.goalAssignments.reduce(
                (sum, ga) => sum + ga.evidenceLogs.length,
                0
            );

            // Calculate rank
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

            // Find top achievement
            const topEvidence = user.goalAssignments
                .flatMap((ga) => ga.evidenceLogs)
                .sort((a, b) => {
                    const aLinks = a.links ? JSON.parse(a.links) : [];
                    const bLinks = b.links ? JSON.parse(b.links) : [];
                    const aScore = (/\d+/.test(a.text) ? 1 : 0) + aLinks.length;
                    const bScore = (/\d+/.test(b.text) ? 1 : 0) + bLinks.length;
                    return bScore - aScore;
                })[0];

            // Send email
            await sendWeeklySummaryEmail(user.email, user.name, {
                activeGoals,
                evidenceAdded,
                currentRank: rank,
                totalUsers: allUsers.length,
                topAchievement: topEvidence?.text.slice(0, 200),
            });

            console.log(`Sent weekly summary to ${user.name}`);
        } catch (error) {
            console.error(`Error processing user ${user.name}:`, error);
        }
    }

    console.log("Weekly summary generation complete!");
}

// Run if called directly
if (require.main === module) {
    generateWeeklySummaries()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Fatal error:", error);
            process.exit(1);
        });
}

export { generateWeeklySummaries };
