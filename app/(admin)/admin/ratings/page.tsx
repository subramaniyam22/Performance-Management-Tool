import { prisma } from "@/lib/prisma";
import { RatingsClient } from "./ratings-client";
import { auth } from "@/lib/auth";

export default async function RatingsPage() {
    const session = await auth();
    if (!session?.user) return null;

    // Fetch all active goal assignments with user and goal info
    const assignments = await prisma.goalAssignment.findMany({
        where: {
            status: "ACTIVE",
        },
        include: {
            user: true,
            goal: true,
            cycle: true,
            ratings: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                    ratedBy: true,
                },
            },
            evidenceLogs: {
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: { evidenceLogs: true },
            },
        },
        orderBy: [{ user: { name: "asc" } }, { goal: { title: "asc" } }],
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ratings</h1>
                <p className="text-muted-foreground">
                    Submit performance ratings for team members' goals
                </p>
            </div>

            <RatingsClient assignments={assignments} currentUserRole={session.user.role} />
        </div>
    );
}
