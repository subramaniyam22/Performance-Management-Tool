"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const cycleSchema = z.object({
    label: z.string().min(1, "Label is required"),
    type: z.enum(["QUARTER", "HALF", "YEAR"]),
    startAt: z.string(),
    endAt: z.string(),
});

export async function createCycle(data: z.infer<typeof cycleSchema>) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = cycleSchema.parse(data);

        const cycle = await prisma.cycle.create({
            data: {
                label: validated.label,
                type: validated.type,
                startAt: new Date(validated.startAt),
                endAt: new Date(validated.endAt),
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "CREATE",
            entityType: "Cycle",
            entityId: cycle.id,
            afterJson: { label: cycle.label, type: cycle.type },
        });

        revalidatePath("/admin/cycles");
        return { success: true, data: cycle };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Create cycle error:", error);
        return { success: false, error: "Failed to create cycle" };
    }
}

export async function updateCycle(
    cycleId: string,
    data: Partial<z.infer<typeof cycleSchema>>
) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const cycle = await prisma.cycle.update({
            where: { id: cycleId },
            data: {
                label: data.label,
                type: data.type,
                startAt: data.startAt ? new Date(data.startAt) : undefined,
                endAt: data.endAt ? new Date(data.endAt) : undefined,
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "UPDATE",
            entityType: "Cycle",
            entityId: cycleId,
            afterJson: { label: cycle.label },
        });

        revalidatePath("/admin/cycles");
        return { success: true, data: cycle };
    } catch (error) {
        console.error("Update cycle error:", error);
        return { success: false, error: "Failed to update cycle" };
    }
}

export async function deleteCycle(cycleId: string) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Check if cycle has assignments
        const assignmentCount = await prisma.goalAssignment.count({
            where: { cycleId },
        });

        if (assignmentCount > 0) {
            return {
                success: false,
                error: `Cannot delete cycle with ${assignmentCount} goal assignments`,
            };
        }

        await prisma.cycle.delete({
            where: { id: cycleId },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "DELETE",
            entityType: "Cycle",
            entityId: cycleId,
        });

        revalidatePath("/admin/cycles");
        return { success: true };
    } catch (error) {
        console.error("Delete cycle error:", error);
        return { success: false, error: "Failed to delete cycle" };
    }
}
