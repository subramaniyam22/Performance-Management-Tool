"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";
import { z } from "zod";

export async function registerUser(data: z.infer<typeof registerSchema>) {
    try {
        const validated = registerSchema.parse(data);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validated.email.toLowerCase() },
        });

        if (existingUser) {
            return { success: false, error: "Email already registered" };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(validated.password, 12);

        // Create user
        await prisma.user.create({
            data: {
                name: validated.name,
                email: validated.email.toLowerCase(),
                passwordHash,
                role: "WIS", // Default role
                status: "ACTIVE",
            },
        });

        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Registration error:", error);
        return { success: false, error: "Failed to create account" };
    }
}
