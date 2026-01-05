import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, generateFileKey } from "@/lib/storage";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const evidenceId = formData.get("evidenceId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!evidenceId) {
            return NextResponse.json({ error: "Evidence ID required" }, { status: 400 });
        }

        // Verify evidence belongs to user
        const evidence = await prisma.evidenceLog.findFirst({
            where: {
                id: evidenceId,
                goalAssignment: {
                    userId: session.user.id,
                },
            },
        });

        if (!evidence) {
            return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique key
        const key = generateFileKey(session.user.id, "evidence", file.name);

        // Upload to S3
        const uploadResult = await uploadFile({
            file: buffer,
            key,
            contentType: file.type,
            metadata: {
                userId: session.user.id,
                evidenceId,
                originalName: file.name,
            },
        });

        if (!uploadResult.success) {
            return NextResponse.json(
                { error: uploadResult.error || "Upload failed" },
                { status: 500 }
            );
        }

        // Update evidence with attachment URL
        if (uploadResult.url) {
            const currentAttachments = (evidence.attachmentsJson as string[] | null) || [];
            await prisma.evidenceLog.update({
                where: { id: evidenceId },
                data: {
                    attachmentsJson: [...currentAttachments, uploadResult.url] as string[],
                },
            });
        }

        return NextResponse.json({
            success: true,
            url: uploadResult.url,
        });
    } catch (error) {
        console.error("Evidence file upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
