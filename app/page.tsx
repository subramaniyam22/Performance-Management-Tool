import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
    const session = await auth();

    if (session?.user) {
        // Redirect based on role
        if (session.user.role === "ADMIN") {
            redirect("/admin/dashboard");
        } else {
            redirect("/dashboard");
        }
    }

    redirect("/login");
}
