"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { createEvidence } from "./actions";

interface EvidenceFormProps {
    assignmentId: string;
}

export function EvidenceForm({ assignmentId }: EvidenceFormProps) {
    const [text, setText] = useState("");
    const [links, setLinks] = useState<string[]>([""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAddLink = () => {
        setLinks([...links, ""]);
    };

    const handleRemoveLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...links];
        newLinks[index] = value;
        setLinks(newLinks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const validLinks = links.filter((link) => link.trim() !== "");

        const result = await createEvidence({
            goalAssignmentId: assignmentId,
            text,
            links: validLinks.length > 0 ? validLinks : undefined,
        });

        if (!result.success) {
            setError(result.error || "Failed to add evidence");
            setLoading(false);
            return;
        }

        // Reset form
        setText("");
        setLinks([""]);
        setLoading(false);

        // Refresh the page to show new evidence
        window.location.reload();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="text">Impact / Value Created *</Label>
                <Textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Describe the impact you created, value delivered, or progress made on this goal. Be specific and include metrics where possible."
                    rows={6}
                    required
                    disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                    Minimum 10 characters. Include specific details, metrics, and outcomes.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Supporting Links (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                    Add links to PRs, issues, documentation, or other relevant resources
                </p>
                {links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            type="url"
                            value={link}
                            onChange={(e) => handleLinkChange(index, e.target.value)}
                            placeholder="https://example.com/pr/123"
                            disabled={loading}
                        />
                        {links.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveLink(index)}
                                disabled={loading}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLink}
                    disabled={loading}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Link
                </Button>
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? "Adding Evidence..." : "Add Evidence"}
            </Button>
        </form>
    );
}
