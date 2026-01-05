"use client";

import { useState } from "react";
import { LevelFramework } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, GraduationCap } from "lucide-react";
import { createLevelFramework, updateLevelFramework, deleteLevelFramework } from "./actions";

interface LevelsClientProps {
    frameworks: LevelFramework[];
    roles: string[];
}

export function LevelsClient({ frameworks: initialFrameworks, roles }: LevelsClientProps) {
    const [frameworks, setFrameworks] = useState(initialFrameworks);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedFramework, setSelectedFramework] = useState<LevelFramework | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [role, setRole] = useState("");
    const [levelName, setLevelName] = useState("");
    const [expectationsText, setExpectationsText] = useState("");

    const handleCreate = () => {
        setSelectedFramework(null);
        setRole("");
        setLevelName("");
        setExpectationsText("");
        setError("");
        setDialogOpen(true);
    };

    const handleEdit = (framework: LevelFramework) => {
        setSelectedFramework(framework);
        setRole(framework.role);
        setLevelName(framework.levelName);
        setExpectationsText(framework.expectationsText);
        setError("");
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let result;
            if (selectedFramework) {
                result = await updateLevelFramework(selectedFramework.id, {
                    levelName,
                    expectationsText,
                });
            } else {
                result = await createLevelFramework({
                    role,
                    levelName,
                    expectationsText,
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

    const handleDelete = async (framework: LevelFramework) => {
        if (!confirm(`Are you sure you want to delete level "${framework.levelName}" for ${framework.role}?`)) return;

        const result = await deleteLevelFramework(framework.id);
        if (result.success) {
            setFrameworks(frameworks.filter((f) => f.id !== framework.id));
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Level
                </Button>
            </div>

            <Tabs defaultValue={roles[0] || "all"}>
                <TabsList>
                    {roles.map((r) => (
                        <TabsTrigger key={r} value={r}>
                            {r}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {roles.map((r) => (
                    <TabsContent key={r} value={r} className="space-y-4">
                        {frameworks
                            .filter((f) => f.role === r)
                            .map((framework) => (
                                <Card key={framework.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="flex items-center gap-2">
                                                    <GraduationCap className="h-5 w-5" />
                                                    {framework.levelName}
                                                </CardTitle>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(framework)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(framework)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Expectations</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {framework.expectationsText}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </TabsContent>
                ))}
            </Tabs>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedFramework ? "Edit Level Framework" : "Add Level Framework"}
                        </DialogTitle>
                        <DialogDescription>
                            Define expectations and criteria for a career level
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role *</Label>
                                <Select
                                    value={role}
                                    onValueChange={setRole}
                                    disabled={loading || !!selectedFramework}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WIS">WIS</SelectItem>
                                        <SelectItem value="QC">QC</SelectItem>
                                        <SelectItem value="PC">PC</SelectItem>
                                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="levelName">Level Name *</Label>
                                <Input
                                    id="levelName"
                                    value={levelName}
                                    onChange={(e) => setLevelName(e.target.value)}
                                    placeholder="e.g., Senior Developer"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expectationsText">Expectations *</Label>
                            <Textarea
                                id="expectationsText"
                                value={expectationsText}
                                onChange={(e) => setExpectationsText(e.target.value)}
                                placeholder="Describe what's expected at this level..."
                                rows={6}
                                required
                                disabled={loading}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : selectedFramework ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
