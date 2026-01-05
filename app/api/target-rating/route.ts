import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { targetRating } = await request.json();

        // Validate rating
        const validRatings = ["MEETS_EXPECTATIONS", "EXCEEDS_EXPECTATIONS", "OUTSTANDING"];
        if (!validRatings.includes(targetRating)) {
            return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
        }

        // Update user's target rating
        await prisma.user.update({
            where: { id: session.user.id },
            data: { targetRating },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving target rating:", error);
        return NextResponse.json({ error: "Failed to save target rating" }, { status: 500 });
    }
}
