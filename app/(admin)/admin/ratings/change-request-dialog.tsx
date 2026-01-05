"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { requestRatingChange } from "./actions";

interface ChangeRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ratingEventId: string;
    onSuccess: () => void;
}

export function ChangeRequestDialog({
    open,
    onOpenChange,
    ratingEventId,
    onSuccess,
}: ChangeRequestDialogProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Please provide a reason for the change request");
            return;
        }

        setLoading(true);
        setError("");

        const result = await requestRatingChange(ratingEventId, reason);

        setLoading(false);

        if (result.success) {
            setReason("");
            onOpenChange(false);
            onSuccess();
        } else {
            setError(result.error || "Failed to submit change request");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Rating Change</DialogTitle>
                    <DialogDescription>
                        This rating is approved and locked. Provide a reason for requesting permission
                        to modify it. An admin will review your request.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Change *</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why this rating needs to be changed..."
                            rows={4}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
