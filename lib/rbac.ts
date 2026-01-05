import { UserRole } from "@prisma/client";

export type Permission =
    | "users:create"
    | "users:read"
    | "users:update"
    | "users:delete"
    | "users:change_role"
    | "teams:create"
    | "teams:read"
    | "teams:update"
    | "teams:delete"
    | "goals:create"
    | "goals:read"
    | "goals:update"
    | "goals:delete"
    | "goals:assign"
    | "subtargets:create"
    | "subtargets:read"
    | "subtargets:update"
    | "subtargets:delete"
    | "subtargets:approve"
    | "ratings:create"
    | "ratings:read"
    | "evidence:create"
    | "evidence:read"
    | "dashboard:admin"
    | "dashboard:user"
    | "leaderboard:read"
    | "coach:use"
    | "levels:manage"
    | "audit:read";

const rolePermissions: Record<UserRole, Permission[]> = {
    ADMIN: [
        "users:create",
        "users:read",
        "users:update",
        "users:delete",
        "users:change_role",
        "teams:create",
        "teams:read",
        "teams:update",
        "teams:delete",
        "goals:create",
        "goals:read",
        "goals:update",
        "goals:delete",
        "goals:assign",
        "subtargets:create",
        "subtargets:read",
        "subtargets:update",
        "subtargets:delete",
        "subtargets:approve",
        "ratings:create",
        "ratings:read",
        "evidence:read",
        "dashboard:admin",
        "dashboard:user",
        "leaderboard:read",
        "coach:use",
        "levels:manage",
        "audit:read",
    ],
    SUPERVISOR: [
        "users:create",
        "users:read",
        "teams:read",
        "goals:read",
        "goals:assign",
        "subtargets:read",
        "subtargets:approve",
        "ratings:create",
        "ratings:read",
        "evidence:read",
        "dashboard:user",
        "leaderboard:read",
        "coach:use",
    ],
    WIS: [
        "goals:read",
        "subtargets:create",
        "subtargets:read",
        "subtargets:update",
        "subtargets:delete",
        "evidence:create",
        "evidence:read",
        "ratings:read",
        "dashboard:user",
        "leaderboard:read",
        "coach:use",
    ],
    QC: [
        "goals:read",
        "subtargets:create",
        "subtargets:read",
        "subtargets:update",
        "subtargets:delete",
        "evidence:create",
        "evidence:read",
        "ratings:read",
        "dashboard:user",
        "leaderboard:read",
        "coach:use",
    ],
    PC: [
        "goals:read",
        "subtargets:create",
        "subtargets:read",
        "subtargets:update",
        "subtargets:delete",
        "evidence:create",
        "evidence:read",
        "ratings:read",
        "dashboard:user",
        "leaderboard:read",
        "coach:use",
    ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every((permission) => hasPermission(role, permission));
}

export function isAdmin(role: UserRole): boolean {
    return role === "ADMIN";
}

export function isSupervisor(role: UserRole): boolean {
    return role === "SUPERVISOR";
}

export function isAdminOrSupervisor(role: UserRole): boolean {
    return role === "ADMIN" || role === "SUPERVISOR";
}

export function canManageUsers(role: UserRole): boolean {
    return hasPermission(role, "users:create");
}

export function canAssignGoals(role: UserRole): boolean {
    return hasPermission(role, "goals:assign");
}

export function canSubmitRatings(role: UserRole): boolean {
    return hasPermission(role, "ratings:create");
}

export function canViewAdminDashboard(role: UserRole): boolean {
    return hasPermission(role, "dashboard:admin");
}

export function canManageTeams(role: UserRole): boolean {
    return hasPermission(role, "teams:create");
}

export function canManageGoals(role: UserRole): boolean {
    return hasPermission(role, "goals:create");
}

export function canCreateSubTargets(role: UserRole): boolean {
    return hasPermission(role, "subtargets:create");
}

export function canApproveSubTargets(role: UserRole): boolean {
    return hasPermission(role, "subtargets:approve");
}
