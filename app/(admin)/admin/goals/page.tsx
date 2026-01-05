import { prisma } from "@/lib/prisma";
import { GoalsClient } from "./goals-client";

export default async function GoalsPage() {
    const [goals, users, cycles] = await Promise.all([
        prisma.goal.findMany({
            where: { isActive: true },
            include: {
                createdBy: true,
                assignments: {
                    where: { status: "ACTIVE" },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        cycle: {
                            select: {
                                id: true,
                                label: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { assignments: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
            where: { status: "ACTIVE" },
            orderBy: { name: "asc" },
        }),
        prisma.cycle.findMany({
            orderBy: { startAt: "desc" },
        }),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Goals Management</h1>
                <p className="text-muted-foreground">Create and assign performance goals</p>
            </div>

            <GoalsClient goals={goals} users={users} cycles={cycles} />
        </div>
    );
}
