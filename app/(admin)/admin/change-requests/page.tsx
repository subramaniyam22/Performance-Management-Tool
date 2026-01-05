import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { reviewChangeRequest } from "../ratings/actions";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default async function ChangeRequestsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/admin/dashboard");
    }

    const changeRequests = await prisma.ratingChangeRequest.findMany({
        include: {
            requestedBy: true,
            reviewedBy: true,
            ratingEvent: {
                include: {
                    goalAssignment: {
                        include: {
                            user: true,
                            goal: true,
                        },
                    },
                },
            },
        },
        orderBy: [
            { status: "asc" }, // PENDING first
            { createdAt: "desc" },
        ],
    });

    const pendingRequests = changeRequests.filter((r) => r.status === "PENDING");
    const reviewedRequests = changeRequests.filter((r) => r.status !== "PENDING");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Rating Change Requests</h1>
                <p className="text-muted-foreground">
                    Review and approve/reject change requests from supervisors
                </p>
            </div>

            {/* Pending Requests */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
                {pendingRequests.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No pending change requests
                        </CardContent>
                    </Card>
                ) : (
                    pendingRequests.map((request) => (
                        <Card key={request.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">
                                            {request.ratingEvent.goalAssignment.user.name} - {request.ratingEvent.goalAssignment.goal.title}
                                        </CardTitle>
                                        <CardDescription>
                                            Requested by {request.requestedBy.name} on {formatDate(request.createdAt)}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pending
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium mb-1">Reason for Change:</p>
                                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                                </div>

                                <div className="flex gap-2">
                                    <form action={async () => {
                                        "use server";
                                        await reviewChangeRequest(request.id, true);
                                    }}>
                                        <Button type="submit" size="sm">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                    </form>
                                    <form action={async () => {
                                        "use server";
                                        await reviewChangeRequest(request.id, false, "Request denied");
                                    }}>
                                        <Button type="submit" size="sm" variant="outline">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Reviewed Requests */}
            {reviewedRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Reviewed Requests ({reviewedRequests.length})</h2>
                    {reviewedRequests.map((request) => (
                        <Card key={request.id} className="opacity-75">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">
                                            {request.ratingEvent.goalAssignment.user.name} - {request.ratingEvent.goalAssignment.goal.title}
                                        </CardTitle>
                                        <CardDescription>
                                            Reviewed by {request.reviewedBy?.name} on {request.reviewedAt ? formatDate(request.reviewedAt) : "N/A"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={request.status === "APPROVED" ? "default" : "destructive"}>
                                        {request.status === "APPROVED" ? (
                                            <><CheckCircle className="h-3 w-3 mr-1" /> Approved</>
                                        ) : (
                                            <><XCircle className="h-3 w-3 mr-1" /> Rejected</>
                                        )}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-medium">Reason:</p>
                                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                                    </div>
                                    {request.reviewNotes && (
                                        <div>
                                            <p className="text-sm font-medium">Review Notes:</p>
                                            <p className="text-sm text-muted-foreground">{request.reviewNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
