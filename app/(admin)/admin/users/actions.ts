"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createUserSchema, updateUserSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function createUser(data: z.infer<typeof createUserSchema>) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = createUserSchema.parse(data);

        const existing = await prisma.user.findUnique({
            where: { email: validated.email.toLowerCase() },
        });

        if (existing) {
            return { success: false, error: "Email already exists" };
        }

        const passwordHash = await bcrypt.hash(validated.password, 12);

        const user = await prisma.user.create({
            data: {
                name: validated.name,
                email: validated.email.toLowerCase(),
                passwordHash,
                role: validated.role,
                status: "ACTIVE",
            },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "CREATE",
            entityType: "User",
            entityId: user.id,
            afterJson: { name: user.name, email: user.email, role: user.role },
        });

        revalidatePath("/admin/users");
        return { success: true, data: user };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Create user error:", error);
        return { success: false, error: "Failed to create user" };
    }
}

export async function updateUser(userId: string, data: z.infer<typeof updateUserSchema>) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = updateUserSchema.parse(data);

        const before = await prisma.user.findUnique({ where: { id: userId } });
        if (!before) {
            return { success: false, error: "User not found" };
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: validated,
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "UPDATE",
            entityType: "User",
            entityId: user.id,
            beforeJson: { name: before.name, role: before.role, status: before.status },
            afterJson: { name: user.name, role: user.role, status: user.status },
        });

        revalidatePath("/admin/users");
        return { success: true, data: user };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Update user error:", error);
        return { success: false, error: "Failed to update user" };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return { success: false, error: "User not found" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { status: "DELETED" },
        });

        await createAuditLog({
            actorUserId: session.user.id,
            action: "DELETE",
            entityType: "User",
            entityId: userId,
            beforeJson: { name: user.name, email: user.email },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Delete user error:", error);
        return { success: false, error: "Failed to delete user" };
    }
}
