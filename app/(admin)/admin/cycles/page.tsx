import { prisma } from "@/lib/prisma";
import { CyclesClient } from "./cycles-client";

export default async function CyclesPage() {
    const cycles = await prisma.cycle.findMany({
        include: {
            _count: {
                select: { goalAssignments: true },
            },
        },
        orderBy: { startAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cycles Management</h1>
                <p className="text-muted-foreground">Manage performance review cycles</p>
            </div>

            <CyclesClient cycles={cycles} />
        </div>
    );
}
