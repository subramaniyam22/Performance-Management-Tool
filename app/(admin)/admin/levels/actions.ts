"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const levelFrameworkSchema = z.object({
    role: z.string(),
    levelName: z.string(),
    expectationsText: z.string(),
    expectationsJson: z.any().optional(),
});

export async function createLevelFramework(data: z.infer<typeof levelFrameworkSchema>) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = levelFrameworkSchema.parse(data);

        const framework = await prisma.levelFramework.create({
            data: {
                role: validated.role as any,
                levelName: validated.levelName,
                expectationsText: validated.expectationsText,
                expectationsJson: validated.expectationsJson,
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "CREATE",
            entityType: "LevelFramework",
            entityId: framework.id,
            afterJson: { role: framework.role, levelName: framework.levelName },
        });

        revalidatePath("/admin/levels");
        return { success: true, data: framework };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Create level framework error:", error);
        return { success: false, error: "Failed to create level framework" };
    }
}

export async function updateLevelFramework(
    id: string,
    data: Partial<z.infer<typeof levelFrameworkSchema>>
) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const framework = await prisma.levelFramework.update({
            where: { id },
            data: {
                levelName: data.levelName,
                expectationsText: data.expectationsText,
                expectationsJson: data.expectationsJson,
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "UPDATE",
            entityType: "LevelFramework",
            entityId: id,
            afterJson: { levelName: framework.levelName },
        });

        revalidatePath("/admin/levels");
        return { success: true, data: framework };
    } catch (error) {
        console.error("Update level framework error:", error);
        return { success: false, error: "Failed to update level framework" };
    }
}

export async function deleteLevelFramework(id: string) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.levelFramework.delete({
            where: { id },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "DELETE",
            entityType: "LevelFramework",
            entityId: id,
        });

        revalidatePath("/admin/levels");
        return { success: true };
    } catch (error) {
        console.error("Delete level framework error:", error);
        return { success: false, error: "Failed to delete level framework" };
    }
}
