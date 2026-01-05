import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import * as argon2 from "argon2";
import { loginSchema } from "@/lib/validations";
import { UserRole, UserStatus } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || "21600"); // 6 hours in seconds

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma) as Adapter,
    session: {
        strategy: "jwt",
        maxAge: SESSION_MAX_AGE,
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const { email, password } = loginSchema.parse(credentials);

                    const user = await prisma.user.findUnique({
                        where: { email: email.toLowerCase() },
                    });

                    if (!user) {
                        return null;
                    }

                    if (user.status !== UserStatus.ACTIVE) {
                        throw new Error("Account is inactive");
                    }

                    const isValidPassword = await argon2.verify(user.passwordHash, password);

                    if (!isValidPassword) {
                        return null;
                    }

                    // Update last login
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { lastLoginAt: new Date() },
                    });

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        photoUrl: user.photoUrl,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = user.role as UserRole;
                token.photoUrl = user.photoUrl as string | null;
            }

            // Update session (for profile updates)
            if (trigger === "update" && session) {
                token.name = session.name;
                token.photoUrl = session.photoUrl;
            }

            // Sliding session: update iat on every request
            token.iat = Math.floor(Date.now() / 1000);

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                session.user.photoUrl = token.photoUrl as string | null;
            }
            return session;
        },
    },
});
