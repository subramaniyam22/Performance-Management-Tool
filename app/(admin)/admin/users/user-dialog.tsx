"use client";

import { useState, useEffect } from "react";
import { User, UserRole, UserStatus } from "@prisma/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { createUser, updateUser } from "./actions";

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null;
    onSuccess: () => void;
    currentUserRole: UserRole;
}

export function UserDialog({ open, onOpenChange, user, onSuccess, currentUserRole }: UserDialogProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("WIS");
    const [status, setStatus] = useState<UserStatus>("ACTIVE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Update state when user prop changes
    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
            setStatus(user.status);
        } else {
            setName("");
            setEmail("");
            setRole("WIS");
            setStatus("ACTIVE");
        }
        setPassword("");
        setError("");
    }, [user, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let result;
            if (user) {
                // Update existing user
                result = await updateUser(user.id, {
                    name,
                    role,
                    status,
                });
            } else {
                // Create new user
                if (!password) {
                    setError("Password is required for new users");
                    setLoading(false);
                    return;
                }
                result = await createUser({
                    name,
                    email,
                    password,
                    role,
                });
            }

            if (!result.success) {
                setError(result.error || "Operation failed");
                setLoading(false);
                return;
            }

            onSuccess();
            onOpenChange(false);
            // Reset form
            setName("");
            setEmail("");
            setPassword("");
            setRole("WIS");
            setStatus("ACTIVE");
        } catch (err) {
            setError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
                    <DialogDescription>
                        {user ? "Update user information" : "Add a new user to the system"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading || !!user}
                        />
                        {user && <p className="text-xs text-muted-foreground">Email cannot be changed</p>}
                    </div>

                    {!user && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={role}
                            onValueChange={(value) => setRole(value as UserRole)}
                            disabled={user?.role === "ADMIN" && currentUserRole !== "ADMIN"}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Show current role if it's ADMIN/SUPERVISOR even for non-ADMIN users (read-only) */}
                                {user?.role === "ADMIN" && currentUserRole !== "ADMIN" && (
                                    <SelectItem value="ADMIN" disabled>Admin (Read-only)</SelectItem>
                                )}
                                {user?.role === "SUPERVISOR" && currentUserRole !== "ADMIN" && (
                                    <SelectItem value="SUPERVISOR" disabled>Supervisor (Read-only)</SelectItem>
                                )}

                                {/* Only ADMIN can assign/change ADMIN role */}
                                {currentUserRole === "ADMIN" && (
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                )}
                                {/* Only ADMIN can assign/change SUPERVISOR role */}
                                {currentUserRole === "ADMIN" && (
                                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                )}
                                {/* Everyone can see team member roles */}
                                <SelectItem value="WIS">Developer (WIS)</SelectItem>
                                <SelectItem value="QC">QC Engineer</SelectItem>
                                <SelectItem value="PC">Project Coordinator</SelectItem>
                            </SelectContent>
                        </Select>
                        {user?.role === "ADMIN" && currentUserRole !== "ADMIN" && (
                            <p className="text-xs text-muted-foreground">
                                Only Admin users can change Admin roles
                            </p>
                        )}
                    </div>

                    {user && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={(value) => setStatus(value as UserStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : user ? "Update User" : "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
