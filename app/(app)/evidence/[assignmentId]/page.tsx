import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime, getRatingLabel, getRatingColor } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EvidenceForm } from "./evidence-form";

export default async function EvidencePage({ params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { assignmentId } = await params;

    const assignment = await prisma.goalAssignment.findUnique({
        where: { id: assignmentId },
        include: {
            goal: true,
            cycle: true,
            user: true,
            ratings: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                    ratedBy: true,
                },
            },
            evidenceLogs: {
                orderBy: { createdAt: "desc" },
                include: {
                    user: true,
                },
            },
        },
    });

    if (!assignment) {
        return <div>Goal assignment not found</div>;
    }

    if (assignment.userId !== session.user.id) {
        redirect("/dashboard");
    }

    const latestRating = assignment.ratings[0];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Goal Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle>{assignment.goal.title}</CardTitle>
                            <CardDescription className="mt-2">{assignment.goal.description}</CardDescription>
                        </div>
                        <Badge variant="outline">{assignment.goal.weightage}%</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                        <div>
                            <span className="text-muted-foreground">Cycle:</span>{" "}
                            <span className="font-medium">{assignment.cycle.label}</span>
                        </div>
                        {latestRating && (
                            <div>
                                <span className="text-muted-foreground">Current Rating:</span>{" "}
                                <span className={`font-medium ${getRatingColor(latestRating.rating)}`}>
                                    {getRatingLabel(latestRating.rating)}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="text-muted-foreground">Evidence Count:</span>{" "}
                            <span className="font-medium">{assignment.evidenceLogs.length}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Evidence Quality Rubric */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-lg">Evidence Quality Checklist</CardTitle>
                    <CardDescription>Strong evidence includes:</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            <span>Specific metrics and numbers (e.g., "Reduced load time by 40%")</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            <span>Links to PRs, issues, or documentation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            <span>Stakeholder feedback or quotes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            <span>Before/after comparisons</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            <span>Business impact or value created</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add Evidence Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Add New Evidence</CardTitle>
                    <CardDescription>Document your impact and value created for this goal</CardDescription>
                </CardHeader>
                <CardContent>
                    <EvidenceForm assignmentId={assignment.id} />
                </CardContent>
            </Card>

            {/* Evidence Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Evidence History</CardTitle>
                    <CardDescription>All evidence logs for this goal</CardDescription>
                </CardHeader>
                <CardContent>
                    {assignment.evidenceLogs.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No evidence added yet. Add your first evidence entry above!
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {assignment.evidenceLogs.map((evidence) => {
                                const links: string[] = evidence.links ? JSON.parse(evidence.links) : [];
                                return (
                                    <div key={evidence.id} className="border-l-2 border-primary pl-4 pb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                {formatDateTime(evidence.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap mb-2">{evidence.text}</p>
                                        {links.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {links.map((link, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <LinkIcon className="h-3 w-3" />
                                                        Link {idx + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
