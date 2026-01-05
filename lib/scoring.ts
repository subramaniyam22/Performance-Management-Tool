import { Rating } from "@prisma/client";
import { daysAgo } from "./utils";

export interface GoalWithRating {
    goalId: string;
    goalTitle: string;
    weightage: number;
    rating?: Rating;
    lastEvidenceDate?: Date;
    evidenceCount: number;
    hasMetrics: boolean;
    hasLinks: boolean;
}

export interface ScoreBreakdown {
    totalScore: number;
    goalScore: number;
    evidenceScore: number;
    trendAdjustment: number;
    breakdown: {
        goals: {
            goalTitle: string;
            weightage: number;
            rating: string;
            ratingScore: number;
            contribution: number;
        }[];
        evidence: {
            recencyScore: number;
            completenessScore: number;
            qualityScore: number;
        };
        trend: {
            direction: "improving" | "declining" | "stable";
            adjustment: number;
        };
    };
    topReason: string;
}

export interface RatingHistory {
    rating: Rating;
    createdAt: Date;
}

// Convert rating enum to numeric score
export function ratingToScore(rating: Rating): number {
    const scoreMap: Record<Rating, number> = {
        DOES_NOT_MEET: 0.2,
        IMPROVEMENT_NEEDED: 0.4,
        MEETS_EXPECTATIONS: 0.6,
        EXCEEDS_EXPECTATIONS: 0.8,
        OUTSTANDING: 1.0,
    };
    return scoreMap[rating];
}

// Calculate goal score based on weightage and ratings
export function calculateGoalScore(goals: GoalWithRating[]): {
    score: number;
    details: ScoreBreakdown["breakdown"]["goals"];
} {
    let totalScore = 0;
    const details: ScoreBreakdown["breakdown"]["goals"] = [];

    for (const goal of goals) {
        if (!goal.rating) continue;

        const ratingScore = ratingToScore(goal.rating);
        const contribution = (goal.weightage / 100) * ratingScore;
        totalScore += contribution;

        details.push({
            goalTitle: goal.goalTitle,
            weightage: goal.weightage,
            rating: goal.rating,
            ratingScore,
            contribution,
        });
    }

    return { score: totalScore, details };
}

// Calculate evidence score based on recency, completeness, and quality
export function calculateEvidenceScore(goals: GoalWithRating[]): {
    score: number;
    details: ScoreBreakdown["breakdown"]["evidence"];
} {
    let recencyScore = 0;
    let completenessScore = 0;
    let qualityScore = 0;

    const activeGoals = goals.filter((g) => g.rating);
    if (activeGoals.length === 0) {
        return {
            score: 0,
            details: { recencyScore: 0, completenessScore: 0, qualityScore: 0 },
        };
    }

    // Recency: Average days since last evidence (max 30 days)
    const recencyScores: number[] = activeGoals.map((goal) => {
        if (!goal.lastEvidenceDate) return 0;
        const days = daysAgo(goal.lastEvidenceDate);
        if (days === 0) return 1.0;
        if (days <= 7) return 0.8;
        if (days <= 14) return 0.6;
        if (days <= 21) return 0.4;
        if (days <= 30) return 0.2;
        return 0;
    });
    recencyScore = recencyScores.reduce((a, b) => a + b, 0) / activeGoals.length;

    // Completeness: Evidence count per goal (target: at least 3)
    const completenessScores: number[] = activeGoals.map((goal) => {
        if (goal.evidenceCount === 0) return 0;
        if (goal.evidenceCount >= 5) return 1.0;
        if (goal.evidenceCount >= 3) return 0.8;
        if (goal.evidenceCount >= 2) return 0.6;
        return 0.4;
    });
    completenessScore =
        completenessScores.reduce((a, b) => a + b, 0) / activeGoals.length;

    // Quality: Presence of metrics and links
    const qualityScores: number[] = activeGoals.map((goal) => {
        let score = 0.5; // Base score for having evidence
        if (goal.hasMetrics) score += 0.25;
        if (goal.hasLinks) score += 0.25;
        return score;
    });
    qualityScore = qualityScores.reduce((a, b) => a + b, 0) / activeGoals.length;

    // Weighted average: recency 40%, completeness 30%, quality 30%
    const totalEvidenceScore =
        recencyScore * 0.4 + completenessScore * 0.3 + qualityScore * 0.3;

    return {
        score: totalEvidenceScore * 0.2, // Evidence contributes up to 0.2 to total score
        details: { recencyScore, completenessScore, qualityScore },
    };
}

// Calculate trend adjustment from rating history
export function calculateTrendAdjustment(
    ratingHistory: RatingHistory[]
): {
    adjustment: number;
    direction: "improving" | "declining" | "stable";
} {
    if (ratingHistory.length < 2) {
        return { adjustment: 0, direction: "stable" };
    }

    // Sort by date (oldest first)
    const sorted = [...ratingHistory].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Take last 5 ratings
    const recent = sorted.slice(-5);
    const scores = recent.map((r) => ratingToScore(r.rating));

    // Calculate trend: compare first half vs second half
    const midpoint = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, midpoint);
    const secondHalf = scores.slice(midpoint);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    let direction: "improving" | "declining" | "stable" = "stable";
    let adjustment = 0;

    if (diff > 0.1) {
        direction = "improving";
        adjustment = Math.min(diff * 0.1, 0.1); // Max +0.1
    } else if (diff < -0.1) {
        direction = "declining";
        adjustment = Math.max(diff * 0.1, -0.1); // Max -0.1
    }

    return { adjustment, direction };
}

// Calculate complete score with breakdown
export function calculateUserScore(
    goals: GoalWithRating[],
    ratingHistory: RatingHistory[]
): ScoreBreakdown {
    const goalResult = calculateGoalScore(goals);
    const evidenceResult = calculateEvidenceScore(goals);
    const trendResult = calculateTrendAdjustment(ratingHistory);

    const totalScore =
        goalResult.score + evidenceResult.score + trendResult.adjustment;

    // Determine top reason affecting score
    let topReason = "No ratings yet";
    if (goals.some((g) => g.rating)) {
        if (trendResult.direction === "declining") {
            topReason = "Rating trend is declining";
        } else if (evidenceResult.score < 0.1) {
            topReason = "Evidence is missing or outdated";
        } else if (goalResult.score < 0.5) {
            topReason = "Current ratings are below expectations";
        } else if (trendResult.direction === "improving") {
            topReason = "Rating trend is improving";
        } else {
            topReason = "Performance is meeting expectations";
        }
    }

    return {
        totalScore,
        goalScore: goalResult.score,
        evidenceScore: evidenceResult.score,
        trendAdjustment: trendResult.adjustment,
        breakdown: {
            goals: goalResult.details,
            evidence: evidenceResult.details,
            trend: {
                direction: trendResult.direction,
                adjustment: trendResult.adjustment,
            },
        },
        topReason,
    };
}

// Get rating value for comparison (higher is better)
export function getRatingValue(rating: Rating): number {
    const values: Record<Rating, number> = {
        DOES_NOT_MEET: 1,
        IMPROVEMENT_NEEDED: 2,
        MEETS_EXPECTATIONS: 3,
        EXCEEDS_EXPECTATIONS: 4,
        OUTSTANDING: 5,
    };
    return values[rating];
}
