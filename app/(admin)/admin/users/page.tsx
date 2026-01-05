import { prisma } from "@/lib/prisma";
import { UsersClient } from "./users-client";
import { auth } from "@/lib/auth";

export default async function UsersPage() {
    const session = await auth();
    if (!session?.user) return null;

    const users = await prisma.user.findMany({
        where: {
            status: {
                not: "DELETED",
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Create, edit, and manage user accounts</p>
            </div>

            <UsersClient users={users} currentUserRole={session.user.role} />
        </div>
    );
}
