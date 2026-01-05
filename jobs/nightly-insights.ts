#!/usr/bin/env ts-node

/**
 * Nightly Insights Job
 * 
 * Runs nightly to generate AI-powered insights for users:
 * - Detect evidence gaps (14+ days without evidence)
 * - Analyze evidence quality
 * - Detect rating trends
 * - Generate appreciation nudges
 * 
 * Usage: npm run jobs:nightly
 */

import { prisma } from "../lib/prisma";
import { generateEvidenceSuggestion, generateLevelGuidance } from "../lib/ai";
import { sendEvidenceReminderEmail } from "../lib/email";
import { isWithinQuietHours } from "../lib/utils";

async function generateNightlyInsights() {
    console.log("Starting nightly insights generation...");

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
                    evidenceLogs: {
                        orderBy: { createdAt: "desc" },
                    },
                    ratings: {
                        orderBy: { createdAt: "desc" },
                        take: 5,
                    },
                },
            },
            levelSnapshots: {
                orderBy: { computedAt: "desc" },
                take: 1,
            },
        },
    });

    console.log(`Processing ${users.length} users...`);

    for (const user of users) {
        try {
            const insights: string[] = [];

            // Check notification preferences
            const prefs = user.notificationPreferences;
            const emailEnabled = prefs?.emailEnabled !== false;

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

            // 1. Detect evidence gaps (14+ days)
            for (const assignment of user.goalAssignments) {
                const lastEvidence = assignment.evidenceLogs[0];
                const daysSinceEvidence = lastEvidence
                    ? Math.floor(
                        (Date.now() - lastEvidence.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    : 999;

                if (daysSinceEvidence >= 14) {
                    insights.push(
                        `Evidence gap detected for "${assignment.goal.title}" (${daysSinceEvidence} days since last evidence)`
                    );

                    // Send reminder email if enabled
                    if (emailEnabled && prefs?.reminderFrequency !== "NEVER") {
                        await sendEvidenceReminderEmail(
                            user.email,
                            user.name,
                            assignment.goal.title,
                            daysSinceEvidence
                        );
                    }

                    // Generate AI suggestion for evidence
                    const suggestion = await generateEvidenceSuggestion(
                        assignment.goal.title,
                        assignment.goal.description,
                        user.role
                    );

                    if (suggestion.success) {
                        insights.push(`AI suggestion: ${suggestion.message}`);
                    }
                }
            }

            // 2. Analyze evidence quality
            const recentEvidence = user.goalAssignments
                .flatMap((ga) => ga.evidenceLogs)
                .slice(0, 10);

            const evidenceWithoutLinks = recentEvidence.filter((e) => {
                try {
                    const links = e.links ? JSON.parse(e.links) : [];
                    return !links || links.length === 0;
                } catch {
                    return true;
                }
            });

            if (evidenceWithoutLinks.length > 5) {
                insights.push(
                    `Evidence quality: ${evidenceWithoutLinks.length} recent entries lack supporting links`
                );
            }

            const evidenceWithoutMetrics = recentEvidence.filter(
                (e) => !/\d+/.test(e.text) // Check if text contains any numbers (metrics)
            );

            if (evidenceWithoutMetrics.length > 5) {
                insights.push(
                    `Evidence quality: ${evidenceWithoutMetrics.length} recent entries lack quantifiable metrics`
                );
            }

            // 3. Detect rating trends
            const allRatings = user.goalAssignments
                .flatMap((ga) => ga.ratings)
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            if (allRatings.length >= 3) {
                const ratingToScore = (rating: string) => {
                    switch (rating) {
                        case "EXCEEDS_EXPECTATIONS":
                            return 4;
                        case "MEETS_EXPECTATIONS":
                            return 3;
                        case "BELOW_EXPECTATIONS":
                            return 2;
                        case "NEEDS_IMPROVEMENT":
                            return 1;
                        default:
                            return 0;
                    }
                };

                const recentScores = allRatings.slice(-3).map((r) => ratingToScore(r.rating));
                const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

                const olderScores = allRatings
                    .slice(0, -3)
                    .slice(-3)
                    .map((r) => ratingToScore(r.rating));
                const avgOlder =
                    olderScores.length > 0
                        ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
                        : avgRecent;

                if (avgRecent > avgOlder + 0.5) {
                    insights.push("Trend: Performance improving! 📈");
                } else if (avgRecent < avgOlder - 0.5) {
                    insights.push("Trend: Performance declining. Consider reviewing goals. 📉");
                }
            }

            // 4. Generate appreciation nudges
            const recentHighRatings = user.goalAssignments.filter(
                (ga) => ga.ratings[0]?.rating === "EXCEEDS_EXPECTATIONS"
            );

            if (recentHighRatings.length > 0) {
                insights.push(
                    `Great work! You're exceeding expectations on ${recentHighRatings.length} goal(s) 🎉`
                );
            }

            // 5. Level progression insights
            const levelSnapshot = user.levelSnapshots[0];
            if (levelSnapshot?.nextLevel) {
                const avgRating =
                    allRatings.length > 0
                        ? allRatings
                            .slice(-5)
                            .reduce((sum, r) => sum + ratingToScore(r.rating), 0) / Math.min(5, allRatings.length)
                        : 0;

                const guidance = await generateLevelGuidance(
                    levelSnapshot.currentLevel,
                    levelSnapshot.nextLevel,
                    user.role,
                    {
                        goals: user.goalAssignments.length,
                        avgRating: avgRating >= 3.5 ? "Exceeds" : avgRating >= 2.5 ? "Meets" : "Below",
                        evidenceCount: recentEvidence.length,
                    }
                );

                if (guidance.success) {
                    insights.push(`Level progression: ${guidance.message}`);
                }
            }

            // Store insights in database
            if (insights.length > 0) {
                await prisma.aIInsight.create({
                    data: {
                        userId: user.id,
                        insightType: "NIGHTLY_SUMMARY",
                        content: insights.join("\n\n"),
                        metadata: {
                            evidenceGaps: insights.filter((i) => i.includes("Evidence gap")).length,
                            qualityIssues: insights.filter((i) => i.includes("quality")).length,
                            trends: insights.filter((i) => i.includes("Trend")).length,
                        },
                    },
                });

                console.log(`Generated ${insights.length} insights for ${user.name}`);
            }
        } catch (error) {
            console.error(`Error processing user ${user.name}:`, error);
        }
    }

    console.log("Nightly insights generation complete!");
}

// Run if called directly
if (require.main === module) {
    generateNightlyInsights()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Fatal error:", error);
            process.exit(1);
        });
}

export { generateNightlyInsights };
