"use client";

import { useState } from "react";
import { Team, User, TeamMember } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamDialog } from "./team-dialog";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { deleteTeam } from "./actions";

type TeamWithMembers = Team & {
    members: (TeamMember & { user: User })[];
    _count: { members: number };
};

interface TeamsClientProps {
    teams: TeamWithMembers[];
    users: User[];
}

export function TeamsClient({ teams: initialTeams, users }: TeamsClientProps) {
    const [teams, setTeams] = useState(initialTeams);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);

    const filteredTeams = teams.filter((team) =>
        team.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateTeam = () => {
        setSelectedTeam(null);
        setDialogOpen(true);
    };

    const handleEditTeam = (team: TeamWithMembers) => {
        setSelectedTeam(team);
        setDialogOpen(true);
    };

    const handleDeleteTeam = async (team: TeamWithMembers) => {
        if (!confirm(`Are you sure you want to delete "${team.name}"?`)) return;

        const result = await deleteTeam(team.id);
        if (result.success) {
            setTeams(teams.filter((t) => t.id !== team.id));
        } else {
            alert(result.error);
        }
    };

    const handleSuccess = () => {
        window.location.reload();
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teams..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={handleCreateTeam}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTeams.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No teams found
                        </CardContent>
                    </Card>
                ) : (
                    filteredTeams.map((team) => (
                        <Card key={team.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            {team.name}
                                        </CardTitle>
                                        {team.description && (
                                            <CardDescription className="mt-2">{team.description}</CardDescription>
                                        )}
                                    </div>
                                    <Badge variant="outline">{team._count.members} members</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Team Members */}
                                {team.members.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm font-medium text-muted-foreground">Members:</p>
                                        <div className="space-y-2">
                                            {team.members.slice(0, 3).map((member) => (
                                                <div key={member.id} className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={member.user.photoUrl || undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(member.user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{member.user.name}</span>
                                                </div>
                                            ))}
                                            {team.members.length > 3 && (
                                                <p className="text-xs text-muted-foreground">
                                                    +{team.members.length - 3} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 border-t">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditTeam(team)}
                                        className="flex-1"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteTeam(team)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <TeamDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                team={selectedTeam}
                users={users}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
