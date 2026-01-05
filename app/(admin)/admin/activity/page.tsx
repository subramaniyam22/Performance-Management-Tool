import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Activity, User, Target, Users, Award } from "lucide-react";

export default async function ActivityPage() {
    const auditLogs = await prisma.auditLog.findMany({
        include: {
            actor: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    const getActionColor = (action: string) => {
        switch (action) {
            case "CREATE":
                return "bg-green-100 text-green-700";
            case "UPDATE":
                return "bg-blue-100 text-blue-700";
            case "DELETE":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case "User":
                return <User className="h-4 w-4" />;
            case "Team":
                return <Users className="h-4 w-4" />;
            case "Goal":
                return <Target className="h-4 w-4" />;
            case "LevelFramework":
                return <Award className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
                <p className="text-muted-foreground">
                    Recent administrative actions and system events
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>Last 100 administrative actions</CardDescription>
                </CardHeader>
                <CardContent>
                    {auditLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No activity recorded yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {auditLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="mt-0.5">{getEntityIcon(log.entityType)}</div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={getActionColor(log.action)} variant="secondary">
                                                {log.action}
                                            </Badge>
                                            <span className="font-medium">{log.entityType}</span>
                                            {log.entityId && (
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {log.entityId.slice(0, 8)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span>
                                                by <strong>{log.actor?.name || "System"}</strong>
                                            </span>
                                            <span>{formatDate(log.createdAt)}</span>
                                        </div>

                                        {log.afterJson && typeof log.afterJson === "object" && (
                                            <div className="mt-2 text-xs">
                                                {Object.entries(log.afterJson as Record<string, any>)
                                                    .slice(0, 3)
                                                    .map(([key, value]) => (
                                                        <span key={key} className="mr-3 text-muted-foreground">
                                                            {key}: <strong>{String(value)}</strong>
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
