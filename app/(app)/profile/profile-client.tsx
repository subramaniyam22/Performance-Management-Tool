"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User, NotificationPreference } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Upload, X, User as UserIcon } from "lucide-react";
import { getRoleLabel } from "@/lib/utils";

interface ProfileClientProps {
    user: User & { notificationPreferences: NotificationPreference | null };
}

export function ProfileClient({ user }: ProfileClientProps) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(user.photoUrl);
    const [error, setError] = useState("");

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        setError("");
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload/photo", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Upload failed");
            }

            setPhotoUrl(data.url);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to upload photo");
        } finally {
            setUploading(false);
        }
    };

    const handlePhotoRemove = async () => {
        if (!confirm("Remove profile photo?")) return;

        try {
            const response = await fetch("/api/upload/photo", {
                method: "DELETE",
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error("Failed to remove photo");
            }

            setPhotoUrl(null);
            router.refresh();
        } catch (err) {
            setError("Failed to remove photo");
        }
    };

    return (
        <div className="space-y-6">
            {/* Profile Photo */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Photo</CardTitle>
                    <CardDescription>Upload a profile photo (max 5MB)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={photoUrl || undefined} />
                            <AvatarFallback className="text-2xl">
                                <UserIcon className="h-12 w-12" />
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={uploading}
                                    onClick={() => document.getElementById("photo-upload")?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploading ? "Uploading..." : "Upload Photo"}
                                </Button>

                                {photoUrl && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePhotoRemove}
                                        className="text-red-600"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                )}
                            </div>

                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoUpload}
                            />

                            {error && <p className="text-sm text-red-600">{error}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Name</Label>
                            <p className="text-sm font-medium mt-1">{user.name}</p>
                        </div>
                        <div>
                            <Label>Email</Label>
                            <p className="text-sm font-medium mt-1">{user.email}</p>
                        </div>
                        <div>
                            <Label>Role</Label>
                            <div className="text-sm font-medium mt-1">
                                <Badge>{getRoleLabel(user.role)}</Badge>
                            </div>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <div className="text-sm font-medium mt-1">
                                <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                                    {user.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive performance updates via email
                                </p>
                            </div>
                            <Badge variant={user.notificationPreferences?.emailEnabled ? "default" : "secondary"}>
                                {user.notificationPreferences?.emailEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Reminder Frequency</Label>
                                <p className="text-sm text-muted-foreground">
                                    How often to receive evidence reminders
                                </p>
                            </div>
                            <Badge variant="outline">
                                {user.notificationPreferences?.reminderFrequency || "WEEKLY"}
                            </Badge>
                        </div>

                        {user.notificationPreferences?.quietHoursStart && user.notificationPreferences?.quietHoursEnd && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Quiet Hours</Label>
                                    <p className="text-sm text-muted-foreground">
                                        No notifications during these hours
                                    </p>
                                </div>
                                <Badge variant="outline">
                                    {user.notificationPreferences.quietHoursStart} - {user.notificationPreferences.quietHoursEnd}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Contact your administrator to update notification preferences
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
