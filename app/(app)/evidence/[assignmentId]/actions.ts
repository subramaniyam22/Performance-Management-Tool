"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createEvidenceSchema } from "@/lib/validations";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function createEvidence(data: z.infer<typeof createEvidenceSchema>) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const validated = createEvidenceSchema.parse(data);

        // Verify the goal assignment belongs to the user
        const assignment = await prisma.goalAssignment.findUnique({
            where: { id: validated.goalAssignmentId },
        });

        if (!assignment || assignment.userId !== session.user.id) {
            return { success: false, error: "Goal assignment not found" };
        }

        const evidence = await prisma.evidenceLog.create({
            data: {
                goalAssignmentId: validated.goalAssignmentId,
                userId: session.user.id,
                text: validated.text,
                links: JSON.stringify(validated.links || []),
                attachmentsJson: validated.attachmentsJson,
            },
        });

        revalidatePath(`/evidence/${validated.goalAssignmentId}`);
        revalidatePath("/dashboard");
        return { success: true, data: evidence };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        console.error("Create evidence error:", error);
        return { success: false, error: "Failed to create evidence" };
    }
}
