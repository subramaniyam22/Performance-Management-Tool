import { describe, it, expect } from "@jest/globals";
import { ratingToScore, calculateGoalScore, calculateEvidenceScore } from "@/lib/scoring";

describe("Scoring Algorithm", () => {
    describe("ratingToScore", () => {
        it("should convert EXCEEDS_EXPECTATIONS to 4", () => {
            expect(ratingToScore("EXCEEDS_EXPECTATIONS")).toBe(4);
        });

        it("should convert MEETS_EXPECTATIONS to 3", () => {
            expect(ratingToScore("MEETS_EXPECTATIONS")).toBe(3);
        });

        it("should convert BELOW_EXPECTATIONS to 2", () => {
            expect(ratingToScore("BELOW_EXPECTATIONS")).toBe(2);
        });

        it("should convert NEEDS_IMPROVEMENT to 1", () => {
            expect(ratingToScore("NEEDS_IMPROVEMENT")).toBe(1);
        });

        it("should return 0 for invalid rating", () => {
            expect(ratingToScore("INVALID" as any)).toBe(0);
        });
    });

    describe("calculateGoalScore", () => {
        it("should calculate score based on rating and weightage", () => {
            const score = calculateGoalScore("EXCEEDS_EXPECTATIONS", 40);
            expect(score).toBe(160); // 4 * 40
        });

        it("should return 0 for no rating", () => {
            const score = calculateGoalScore(null, 40);
            expect(score).toBe(0);
        });

        it("should handle different weightages", () => {
            expect(calculateGoalScore("MEETS_EXPECTATIONS", 30)).toBe(90); // 3 * 30
            expect(calculateGoalScore("BELOW_EXPECTATIONS", 20)).toBe(40); // 2 * 20
        });
    });

    describe("calculateEvidenceScore", () => {
        it("should score recent evidence higher", () => {
            const recentEvidence = [
                {
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                    text: "Test",
                    supportingLinks: ["link1"],
                    metrics: { metric1: 100 },
                },
            ];

            const oldEvidence = [
                {
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
                    text: "Test",
                    supportingLinks: ["link1"],
                    metrics: { metric1: 100 },
                },
            ];

            const recentScore = calculateEvidenceScore(recentEvidence as any);
            const oldScore = calculateEvidenceScore(oldEvidence as any);

            expect(recentScore).toBeGreaterThan(oldScore);
        });

        it("should score evidence with links and metrics higher", () => {
            const richEvidence = [
                {
                    createdAt: new Date(),
                    text: "Test with metrics and links",
                    supportingLinks: ["link1", "link2"],
                    metrics: { metric1: 100, metric2: 200 },
                },
            ];

            const poorEvidence = [
                {
                    createdAt: new Date(),
                    text: "Test",
                    supportingLinks: null,
                    metrics: null,
                },
            ];

            const richScore = calculateEvidenceScore(richEvidence as any);
            const poorScore = calculateEvidenceScore(poorEvidence as any);

            expect(richScore).toBeGreaterThan(poorScore);
        });

        it("should return 0 for no evidence", () => {
            expect(calculateEvidenceScore([])).toBe(0);
        });
    });
});
