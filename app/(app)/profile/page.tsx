import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./profile-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            notificationPreferences: true,
            levelSnapshots: {
                orderBy: { computedAt: "desc" },
                take: 1,
            },
        },
    });

    if (!user) return null;

    const levelSnapshot = user.levelSnapshots[0];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Photo Upload and Basic Info */}
            <ProfileClient user={user} />

            {/* Career Progression */}
            {levelSnapshot && (
                <Card>
                    <CardHeader>
                        <CardTitle>Career Progression</CardTitle>
                        <CardDescription>Your current level and growth path</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Level</p>
                                <p className="text-2xl font-bold">{levelSnapshot.currentLevel}</p>
                            </div>

                            {levelSnapshot.nextLevel && (
                                <>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Next Level</p>
                                        <p className="text-lg font-semibold">{levelSnapshot.nextLevel}</p>
                                    </div>

                                    {levelSnapshot.tenureMonths && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Estimated Time to Next Level
                                            </p>
                                            <p className="text-lg font-semibold">{levelSnapshot.tenureMonths} months</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {levelSnapshot.rationale && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Assessment</p>
                                    <p className="text-sm mt-1">{levelSnapshot.rationale}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
