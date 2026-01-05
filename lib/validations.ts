import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

// User schemas
export const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    role: z.enum(["ADMIN", "SUPERVISOR", "WIS", "QC", "PC"]),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    role: z.enum(["ADMIN", "SUPERVISOR", "WIS", "QC", "PC"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "DELETED"]).optional(),
});

// Team schemas
export const createTeamSchema = z.object({
    name: z.string().min(2, "Team name must be at least 2 characters"),
    description: z.string().optional(),
});

export const updateTeamSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
});

// Goal schemas
export const createGoalSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    weightage: z.number().min(0).max(100),
    description: z.string().min(10, "Description must be at least 10 characters"),
    customFields: z
        .array(
            z.object({
                key: z.string(),
                label: z.string(),
                fieldType: z.string(),
                required: z.boolean().default(false),
                options: z.any().optional(),
            })
        )
        .optional(),
});

export const assignGoalSchema = z.object({
    goalId: z.string(),
    userIds: z.array(z.string()).min(1, "Select at least one user"),
    cycleId: z.string(),
    dueAt: z.string().optional(),
    fieldValues: z.record(z.string()).optional(),
});

// Evidence schemas
export const createEvidenceSchema = z.object({
    goalAssignmentId: z.string(),
    text: z.string().min(10, "Evidence must be at least 10 characters"),
    links: z.array(z.string().url()).optional(),
    attachmentsJson: z.any().optional(),
});

// Rating schemas
export const createRatingSchema = z.object({
    goalAssignmentId: z.string(),
    rating: z.enum([
        "DOES_NOT_MEET",
        "IMPROVEMENT_NEEDED",
        "MEETS_EXPECTATIONS",
        "EXCEEDS_EXPECTATIONS",
        "OUTSTANDING",
    ]),
    notes: z.string().optional(),
});

// Alias for backwards compatibility
export const submitRatingSchema = createRatingSchema;

// Notification preference schemas
export const updateNotificationPreferenceSchema = z.object({
    emailEnabled: z.boolean().optional(),
    reminderFrequency: z.enum(["daily", "weekly", "none"]).optional(),
    quietHoursStart: z.number().min(0).max(23).optional(),
    quietHoursEnd: z.number().min(0).max(23).optional(),
});

// Level framework schemas
export const createLevelFrameworkSchema = z.object({
    role: z.enum(["ADMIN", "SUPERVISOR", "WIS", "QC", "PC"]),
    levelName: z.string().min(2),
    expectationsText: z.string().min(10),
    expectationsJson: z.any().optional(),
});

// Cycle schemas
export const createCycleSchema = z.object({
    type: z.enum(["QUARTER", "HALF", "YEAR"]),
    label: z.string().min(2),
    startAt: z.string(),
    endAt: z.string().optional(),
});
