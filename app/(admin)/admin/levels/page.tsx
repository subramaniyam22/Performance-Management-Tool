import { prisma } from "@/lib/prisma";
import { LevelsClient } from "./levels-client";

export default async function LevelsPage() {
    const frameworks = await prisma.levelFramework.findMany({
        orderBy: [{ role: "asc" }, { levelName: "asc" }],
    });

    // Get unique roles
    const roles = Array.from(new Set(frameworks.map((f) => f.role)));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Level Frameworks</h1>
                <p className="text-muted-foreground">
                    Define career levels and expectations for each role
                </p>
            </div>

            <LevelsClient frameworks={frameworks} roles={roles} />
        </div>
    );
}
