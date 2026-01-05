"use server";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function requestPasswordReset(data: z.infer<typeof forgotPasswordSchema>) {
    try {
        const validated = forgotPasswordSchema.parse(data);

        const user = await prisma.user.findUnique({
            where: { email: validated.email.toLowerCase() },
        });

        // Don't reveal if user exists or not
        if (!user) {
            return {
                success: true,
                message: "If an account exists, a password reset link has been sent.",
            };
        }

        // Generate reset token
        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Delete any existing tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: { email: user.email },
        });

        // Create new token
        await prisma.passwordResetToken.create({
            data: {
                email: user.email,
                token,
                expires,
            },
        });

        // Send password reset email
        const { sendPasswordResetEmail } = await import("@/lib/email");
        await sendPasswordResetEmail(user.email, token, user.name);


        return {
            success: true,
            message: "If an account exists, a password reset link has been sent.",
            // In development, return the token
            ...(process.env.NODE_ENV === "development" && { token }),
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Request password reset error:", error);
        return { success: false, error: "Failed to process request" };
    }
}

export async function resetPassword(data: z.infer<typeof resetPasswordSchema>) {
    try {
        const validated = resetPasswordSchema.parse(data);

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token: validated.token },
        });

        if (!resetToken) {
            return { success: false, error: "Invalid or expired reset token" };
        }

        if (resetToken.expires < new Date()) {
            await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
            return { success: false, error: "Reset token has expired" };
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: resetToken.email },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(validated.password, 12);

        // Update user password
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        // Delete the used token
        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

        return { success: true, message: "Password reset successfully" };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Reset password error:", error);
        return { success: false, error: "Failed to reset password" };
    }
}
