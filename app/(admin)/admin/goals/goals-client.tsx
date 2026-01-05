"use client";

import { useState } from "react";
import { Goal, User, Cycle, GoalAssignment } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GoalDialog } from "./goal-dialog";
import { AssignGoalDialog } from "./assign-goal-dialog";
import { Plus, Search, Edit, Trash2, UserPlus } from "lucide-react";
import { deleteGoal } from "./actions";

type GoalWithDetails = Goal & {
    createdBy: User;
    assignments: (GoalAssignment & {
        user: { id: string; name: string; email: string };
        cycle: { id: string; label: string };
    })[];
    _count: { assignments: number };
};

interface GoalsClientProps {
    goals: GoalWithDetails[];
    users: User[];
    cycles: Cycle[];
}

export function GoalsClient({ goals: initialGoals, users, cycles }: GoalsClientProps) {
    const [goals, setGoals] = useState(initialGoals);
    const [search, setSearch] = useState("");
    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

    const filteredGoals = goals.filter((goal) =>
        goal.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateGoal = () => {
        setSelectedGoal(null);
        setGoalDialogOpen(true);
    };

    const handleEditGoal = (goal: Goal) => {
        setSelectedGoal(goal);
        setGoalDialogOpen(true);
    };

    const handleAssignGoal = (goal: Goal) => {
        setSelectedGoal(goal);
        setAssignDialogOpen(true);
    };

    const handleDeleteGoal = async (goal: Goal) => {
        if (!confirm(`Are you sure you want to delete "${goal.title}"?`)) return;

        const result = await deleteGoal(goal.id);
        if (result.success) {
            setGoals(goals.filter((g) => g.id !== goal.id));
        } else {
            alert(result.error);
        }
    };

    const handleSuccess = () => {
        window.location.reload();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search goals..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={handleCreateGoal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Goals</CardTitle>
                    <CardDescription>Manage performance goals and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Weightage</TableHead>
                                <TableHead>Assignments</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGoals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No goals found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredGoals.map((goal) => (
                                    <TableRow key={goal.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{goal.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {goal.description}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{goal.weightage}%</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="group relative inline-block">
                                                <Badge className="cursor-help">
                                                    {goal._count.assignments} user{goal._count.assignments !== 1 ? 's' : ''}
                                                </Badge>
                                                {goal.assignments.length > 0 && (
                                                    <div className="invisible group-hover:visible absolute z-10 w-64 p-3 bg-white border rounded-lg shadow-lg bottom-full left-0 mb-2">
                                                        <p className="text-xs font-semibold mb-2">Assigned to:</p>
                                                        <div className="space-y-1">
                                                            {goal.assignments.map((assignment) => (
                                                                <div key={assignment.id} className="text-xs">
                                                                    <span className="font-medium">{assignment.user.name}</span>
                                                                    <span className="text-muted-foreground"> ({assignment.cycle.label})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {goal.createdBy.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAssignGoal(goal)}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Assign
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditGoal(goal)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteGoal(goal)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <GoalDialog
                open={goalDialogOpen}
                onOpenChange={setGoalDialogOpen}
                goal={selectedGoal}
                onSuccess={handleSuccess}
            />

            {selectedGoal && (
                <AssignGoalDialog
                    open={assignDialogOpen}
                    onOpenChange={setAssignDialogOpen}
                    goal={selectedGoal}
                    users={users}
                    cycles={cycles}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
