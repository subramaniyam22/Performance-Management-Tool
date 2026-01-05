import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { isAdminOrSupervisor } from "@/lib/rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (!isAdminOrSupervisor(session.user.role)) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={{
                id: session.user.id,
                name: session.user.name || null,
                email: session.user.email || null,
                role: session.user.role,
                photoUrl: session.user.photoUrl || null,
            }} />
            <main className="container mx-auto py-6 px-4">{children}</main>
        </div>
    );
}
