import { prisma } from "@/lib/prisma";
import { TeamsClient } from "./teams-client";

export default async function TeamsPage() {
    const [teams, users] = await Promise.all([
        prisma.team.findMany({
            include: {
                members: {
                    include: {
                        user: true,
                    },
                },
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
            where: { status: "ACTIVE" },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                <p className="text-muted-foreground">Create and manage teams</p>
            </div>

            <TeamsClient teams={teams} users={users} />
        </div>
    );
}
