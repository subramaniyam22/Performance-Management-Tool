"use client";

import { useState } from "react";
import { Cycle } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { createCycle, updateCycle, deleteCycle } from "./actions";
import { formatDate } from "@/lib/utils";

type CycleWithCount = Cycle & { _count: { goalAssignments: number } };

interface CyclesClientProps {
    cycles: CycleWithCount[];
}

export function CyclesClient({ cycles: initialCycles }: CyclesClientProps) {
    const [cycles, setCycles] = useState(initialCycles);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState<CycleWithCount | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [label, setLabel] = useState("");
    const [type, setType] = useState<"QUARTER" | "HALF" | "YEAR">("QUARTER");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");

    const handleCreate = () => {
        setSelectedCycle(null);
        setLabel("");
        setType("QUARTER");
        setStartAt("");
        setEndAt("");
        setError("");
        setDialogOpen(true);
    };

    const handleEdit = (cycle: CycleWithCount) => {
        setSelectedCycle(cycle);
        setLabel(cycle.label);
        setType(cycle.type);
        setStartAt(cycle.startAt.toISOString().split("T")[0]);
        setEndAt(cycle.endAt ? cycle.endAt.toISOString().split("T")[0] : "");
        setError("");
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let result;
            if (selectedCycle) {
                result = await updateCycle(selectedCycle.id, {
                    label,
                    type,
                    startAt,
                    endAt,
                });
            } else {
                result = await createCycle({
                    label,
                    type,
                    startAt,
                    endAt,
                });
            }

            if (!result.success) {
                setError(result.error || "Operation failed");
                setLoading(false);
                return;
            }

            setDialogOpen(false);
            window.location.reload();
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (cycle: CycleWithCount) => {
        if (!confirm(`Are you sure you want to delete "${cycle.label}"?`)) return;

        const result = await deleteCycle(cycle.id);
        if (result.success) {
            setCycles(cycles.filter((c) => c.id !== cycle.id));
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Cycle
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cycles.map((cycle) => (
                    <Card key={cycle.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {cycle.label}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        <Badge variant="outline">{cycle.type}</Badge>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Start:</span>{" "}
                                    {formatDate(cycle.startAt)}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">End:</span>{" "}
                                    {cycle.endAt ? formatDate(cycle.endAt) : "Not set"}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Assignments:</span>{" "}
                                    <Badge>{cycle._count.goalAssignments}</Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(cycle)} className="flex-1">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(cycle)}
                                    className="text-red-600 hover:text-red-700"
                                    disabled={cycle._count.goalAssignments > 0}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {cycles.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No cycles found. Create one to get started.
                    </CardContent>
                </Card>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedCycle ? "Edit Cycle" : "Create Cycle"}</DialogTitle>
                        <DialogDescription>
                            {selectedCycle ? "Update cycle information" : "Create a new performance cycle"}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="label">Label *</Label>
                            <Input
                                id="label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g., Q1 2024"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Type *</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="QUARTER">Quarter</SelectItem>
                                    <SelectItem value="HALF">Half Year</SelectItem>
                                    <SelectItem value="YEAR">Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startAt">Start Date *</Label>
                                <Input
                                    id="startAt"
                                    type="date"
                                    value={startAt}
                                    onChange={(e) => setStartAt(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endAt">End Date *</Label>
                                <Input
                                    id="endAt"
                                    type="date"
                                    value={endAt}
                                    onChange={(e) => setEndAt(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : selectedCycle ? "Update Cycle" : "Create Cycle"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
