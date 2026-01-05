"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Target,
    Trophy,
    MessageSquare,
    User,
    LogOut,
    Users,
    FolderKanban,
    Star,
    Settings,
    ChevronDown,
    AlertCircle,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { getRoleLabel } from "@/lib/utils";

interface NavbarProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        role: UserRole;
        photoUrl?: string | null;
    };
}

export function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERVISOR";

    const adminLinks = [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/teams", label: "Teams", icon: Users },
        { href: "/admin/goals", label: "Goals", icon: Target },
        { href: "/admin/ratings", label: "Ratings", icon: Star },
        { href: "/admin/change-requests", label: "Change Requests", icon: AlertCircle },
    ];

    const memberLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/goals", label: "My Goals", icon: FolderKanban },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/target", label: "Target", icon: Target },
        { href: "/coach", label: "AI Coach", icon: MessageSquare },
    ];

    const links = isAdmin ? adminLinks : memberLinks;

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <nav className="border-b bg-background">
            <div className="flex h-16 items-center px-4 md:px-6">
                <div className="flex items-center space-x-4 lg:space-x-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-lg">PM</span>
                        </div>
                        <span className="hidden font-bold sm:inline-block">Performance Mgmt</span>
                    </Link>
                </div>

                <div className="ml-8 flex items-center space-x-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                        return (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="hidden md:inline">{link.label}</span>
                                </Button>
                            </Link>
                        );
                    })}
                </div>

                <div className="ml-auto flex items-center space-x-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 gap-2 px-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.photoUrl || undefined} alt={user.name || "User"} />
                                    <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                                </Avatar>
                                <div className="hidden md:flex md:flex-col md:items-start md:text-left">
                                    <span className="text-sm font-medium">{user.name}</span>
                                    <Badge variant="outline" className="text-xs h-5">
                                        {getRoleLabel(user.role)}
                                    </Badge>
                                </div>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    <p className="text-xs leading-none text-muted-foreground mt-1">
                                        {getRoleLabel(user.role)}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/profile#preferences" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Preferences</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
