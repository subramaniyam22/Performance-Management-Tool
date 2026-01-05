"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdminOrSupervisor } from "@/lib/rbac";
import { submitRatingSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function submitRating(data: z.infer<typeof submitRatingSchema>) {
    const session = await auth();
    if (!session?.user || !isAdminOrSupervisor(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = submitRatingSchema.parse(data);

        // Verify the goal assignment exists
        const assignment = await prisma.goalAssignment.findUnique({
            where: { id: validated.goalAssignmentId },
            include: { user: true, goal: true },
        });

        if (!assignment) {
            return { success: false, error: "Goal assignment not found" };
        }

        const rating = await prisma.ratingEvent.create({
            data: {
                goalAssignmentId: validated.goalAssignmentId,
                rating: validated.rating,
                notes: validated.notes,
                ratedByAdminId: session.user.id,
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "SUBMIT_RATING",
            entityType: "RatingEvent",
            entityId: rating.id,
            afterJson: {
                userId: assignment.userId,
                goalId: assignment.goalId,
                rating: validated.rating,
            },
        });

        revalidatePath("/admin/ratings");
        revalidatePath(`/admin/users/${assignment.userId}`);
        return { success: true, data: rating };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Submit rating error:", error);
        return { success: false, error: "Failed to submit rating" };
    }
}

export async function bulkSubmitRatings(
    ratings: Array<{ goalAssignmentId: string; rating: string; notes?: string }>
) {
    const session = await auth();
    if (!session?.user || !isAdminOrSupervisor(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const results = await Promise.all(
            ratings.map((rating) =>
                submitRating({
                    goalAssignmentId: rating.goalAssignmentId,
                    rating: rating.rating as any,
                    notes: rating.notes,
                })
            )
        );

        const failed = results.filter((r) => !r.success);
        if (failed.length > 0) {
            return {
                success: false,
                error: `${failed.length} rating(s) failed to submit`,
            };
        }

        return { success: true, data: results };
    } catch (error) {
        console.error("Bulk submit ratings error:", error);
        return { success: false, error: "Failed to submit ratings" };
    }
}

// Approve a rating (SUPERVISOR only)
export async function approveRating(ratingEventId: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPERVISOR") {
        return { success: false, error: "Only supervisors can approve ratings" };
    }

    try {
        const rating = await prisma.ratingEvent.update({
            where: { id: ratingEventId },
            data: {
                isApproved: true,
                approvedAt: new Date(),
                approvedByUserId: session.user.id,
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "APPROVE_RATING",
            entityType: "RatingEvent",
            entityId: rating.id,
            afterJson: { isApproved: true },
        });

        revalidatePath("/admin/ratings");
        return { success: true, data: rating };
    } catch (error) {
        console.error("Approve rating error:", error);
        return { success: false, error: "Failed to approve rating" };
    }
}

// Request change to approved rating (SUPERVISOR only)
export async function requestRatingChange(ratingEventId: string, reason: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPERVISOR") {
        return { success: false, error: "Only supervisors can request changes" };
    }

    try {
        // Check if rating is approved
        const rating = await prisma.ratingEvent.findUnique({
            where: { id: ratingEventId },
        });

        if (!rating?.isApproved) {
            return { success: false, error: "Rating must be approved before requesting changes" };
        }

        // Check for existing pending request
        const existingRequest = await prisma.ratingChangeRequest.findFirst({
            where: {
                ratingEventId,
                status: "PENDING",
            },
        });

        if (existingRequest) {
            return { success: false, error: "A change request is already pending for this rating" };
        }

        const changeRequest = await prisma.ratingChangeRequest.create({
            data: {
                ratingEventId,
                requestedByUserId: session.user.id,
                reason,
                status: "PENDING",
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "REQUEST_RATING_CHANGE",
            entityType: "RatingChangeRequest",
            entityId: changeRequest.id,
            afterJson: { ratingEventId, reason },
        });

        revalidatePath("/admin/ratings");
        return { success: true, data: changeRequest };
    } catch (error) {
        console.error("Request rating change error:", error);
        return { success: false, error: "Failed to request rating change" };
    }
}

// Review change request (ADMIN only)
export async function reviewChangeRequest(
    requestId: string,
    approved: boolean,
    reviewNotes?: string
) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return { success: false, error: "Only admins can review change requests" };
    }

    try {
        const changeRequest = await prisma.ratingChangeRequest.update({
            where: { id: requestId },
            data: {
                status: approved ? "APPROVED" : "REJECTED",
                reviewedByUserId: session.user.id,
                reviewedAt: new Date(),
                reviewNotes,
            },
            include: {
                ratingEvent: true,
            },
        });

        // If approved, unlock the rating temporarily
        if (approved) {
            await prisma.ratingEvent.update({
                where: { id: changeRequest.ratingEventId },
                data: {
                    isApproved: false,
                    approvedAt: null,
                    approvedByUserId: null,
                },
            });
        }

        await createAuditLog({
            actorUserId: session.user.id,
            action: approved ? "APPROVE_CHANGE_REQUEST" : "REJECT_CHANGE_REQUEST",
            entityType: "RatingChangeRequest",
            entityId: changeRequest.id,
            afterJson: { status: changeRequest.status, reviewNotes },
        });

        revalidatePath("/admin/ratings");
        revalidatePath("/admin/change-requests");
        return { success: true, data: changeRequest };
    } catch (error) {
        console.error("Review change request error:", error);
        return { success: false, error: "Failed to review change request" };
    }
}
