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

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique key
        const key = generateFileKey(session.user.id, "photos", file.name);

        // Upload to S3
        const uploadResult = await uploadFile({
            file: buffer,
            key,
            contentType: file.type,
            metadata: {
                userId: session.user.id,
                originalName: file.name,
            },
        });

        if (!uploadResult.success) {
            return NextResponse.json(
                { error: uploadResult.error || "Upload failed" },
                { status: 500 }
            );
        }

        // Update user's photo URL in database
        await prisma.user.update({
            where: { id: session.user.id },
            data: { photoUrl: uploadResult.url },
        });

        return NextResponse.json({
            success: true,
            url: uploadResult.url,
        });
    } catch (error) {
        console.error("Photo upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload photo" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Remove photo URL from database
        await prisma.user.update({
            where: { id: session.user.id },
            data: { photoUrl: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Photo delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete photo" },
            { status: 500 }
        );
    }
}
