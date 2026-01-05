"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [devToken, setDevToken] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await requestPasswordReset({ email });

        if (!result.success) {
            setError(result.error || "Failed to send reset link");
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);

        // In development, show the token
        if ("token" in result && result.token) {
            setDevToken(result.token);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-center">Check Your Email</CardTitle>
                        <CardDescription className="text-center">
                            If an account exists for {email}, we've sent a password reset link.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {devToken && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-xs font-medium text-yellow-800 mb-1">
                                    Development Mode - Reset Token:
                                </p>
                                <code className="text-xs text-yellow-900 break-all">{devToken}</code>
                                <p className="text-xs text-yellow-800 mt-2">
                                    <Link
                                        href={`/reset-password?token=${devToken}`}
                                        className="underline font-medium"
                                    >
                                        Click here to reset password
                                    </Link>
                                </p>
                            </div>
                        )}

                        <Link href="/login">
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Button>

                        <Link href="/login">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Login
                            </Button>
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
