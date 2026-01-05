"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createTeamSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function createTeam(data: z.infer<typeof createTeamSchema>) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = createTeamSchema.parse(data);

        const team = await prisma.team.create({
            data: {
                name: validated.name,
                description: validated.description,
            },
        });

        // Add members if provided
        if (validated.memberIds && validated.memberIds.length > 0) {
            await prisma.teamMember.createMany({
                data: validated.memberIds.map((userId) => ({
                    teamId: team.id,
                    userId,
                })),
            });
        }

        await createAuditLog({
            actorUserId: session.user.id,
            action: "CREATE",
            entityType: "Team",
            entityId: team.id,
            afterJson: { name: team.name, memberCount: validated.memberIds?.length || 0 },
        });

        revalidatePath("/admin/teams");
        return { success: true, data: team };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Create team error:", error);
        return { success: false, error: "Failed to create team" };
    }
}

export async function updateTeam(
    teamId: string,
    data: { name?: string; description?: string; memberIds?: string[] }
) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const team = await prisma.team.update({
            where: { id: teamId },
            data: {
                name: data.name,
                description: data.description,
            },
        });

        // Update members if provided
        if (data.memberIds) {
            // Remove all existing members
            await prisma.teamMember.deleteMany({
                where: { teamId },
            });

            // Add new members
            if (data.memberIds.length > 0) {
                await prisma.teamMember.createMany({
                    data: data.memberIds.map((userId) => ({
                        teamId,
                        userId,
                    })),
                });
            }
        }

        await createAuditLog({
            actorUserId: session.user.id,
            action: "UPDATE",
            entityType: "Team",
            entityId: teamId,
            afterJson: { name: team.name },
        });

        revalidatePath("/admin/teams");
        return { success: true, data: team };
    } catch (error) {
        console.error("Update team error:", error);
        return { success: false, error: "Failed to update team" };
    }
}

export async function deleteTeam(teamId: string) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Delete team members first
        await prisma.teamMember.deleteMany({
            where: { teamId },
        });

        // Delete team
        await prisma.team.delete({
            where: { id: teamId },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "DELETE",
            entityType: "Team",
            entityId: teamId,
        });

        revalidatePath("/admin/teams");
        return { success: true };
    } catch (error) {
        console.error("Delete team error:", error);
        return { success: false, error: "Failed to delete team" };
    }
}
