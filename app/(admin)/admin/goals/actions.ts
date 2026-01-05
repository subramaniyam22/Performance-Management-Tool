"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createGoalSchema, assignGoalSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function createGoal(data: z.infer<typeof createGoalSchema>) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = createGoalSchema.parse(data);

        const goal = await prisma.goal.create({
            data: {
                title: validated.title,
                weightage: validated.weightage,
                description: validated.description,
                createdByAdminId: session.user.id,
                isActive: true,
            },
        });

        // Create custom field definitions if provided
        if (validated.customFields && validated.customFields.length > 0) {
            await prisma.goalFieldDefinition.createMany({
                data: validated.customFields.map((field) => ({
                    goalId: goal.id,
                    key: field.key,
                    label: field.label,
                    fieldType: field.fieldType,
                    required: field.required,
                    options: field.options,
                })),
            });
        }

        await createAuditLog({
            actorUserId: session.user.id,
            action: "CREATE",
            entityType: "Goal",
            entityId: goal.id,
            afterJson: { title: goal.title, weightage: goal.weightage },
        });

        revalidatePath("/admin/goals");
        return { success: true, data: goal };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Create goal error:", error);
        return { success: false, error: "Failed to create goal" };
    }
}

export async function assignGoals(data: z.infer<typeof assignGoalSchema>) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = assignGoalSchema.parse(data);

        // Create assignments for each user
        const assignments = await Promise.all(
            validated.userIds.map(async (userId) => {
                const assignment = await prisma.goalAssignment.create({
                    data: {
                        goalId: validated.goalId,
                        userId,
                        cycleId: validated.cycleId,
                        assignedByAdminId: session.user.id,
                        dueAt: validated.dueAt ? new Date(validated.dueAt) : null,
                        status: "ACTIVE",
                    },
                });

                // Create field values if provided
                if (validated.fieldValues) {
                    await prisma.goalFieldValue.createMany({
                        data: Object.entries(validated.fieldValues).map(([key, value]) => ({
                            goalAssignmentId: assignment.id,
                            key,
                            value,
                        })),
                    });
                }

                await createAuditLog({
                    actorUserId: session.user.id,
                    action: "ASSIGN_GOAL",
                    entityType: "GoalAssignment",
                    entityId: assignment.id,
                    afterJson: { goalId: validated.goalId, userId },
                });

                return assignment;
            })
        );

        revalidatePath("/admin/goals");
        return { success: true, data: assignments };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Assign goals error:", error);
        return { success: false, error: "Failed to assign goals" };
    }
}

export async function updateGoal(goalId: string, data: Partial<z.infer<typeof createGoalSchema>>) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const before = await prisma.goal.findUnique({ where: { id: goalId } });
        if (!before) {
            return { success: false, error: "Goal not found" };
        }

        const goal = await prisma.goal.update({
            where: { id: goalId },
            data: {
                title: data.title,
                weightage: data.weightage,
                description: data.description,
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "UPDATE",
            entityType: "Goal",
            entityId: goal.id,
            beforeJson: { title: before.title, weightage: before.weightage },
            afterJson: { title: goal.title, weightage: goal.weightage },
        });

        revalidatePath("/admin/goals");
        return { success: true, data: goal };
    } catch (error) {
        console.error("Update goal error:", error);
        return { success: false, error: "Failed to update goal" };
    }
}

export async function deleteGoal(goalId: string) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const goal = await prisma.goal.update({
            where: { id: goalId },
            data: { isActive: false },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "DELETE",
            entityType: "Goal",
            entityId: goalId,
            beforeJson: { title: goal.title },
        });

        revalidatePath("/admin/goals");
        return { success: true };
    } catch (error) {
        console.error("Delete goal error:", error);
        return { success: false, error: "Failed to delete goal" };
    }
}
