import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(d);
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(d);
}

export function formatScore(score: number): string {
    return score.toFixed(2);
}

export function getRatingLabel(rating: string): string {
    const labels: Record<string, string> = {
        DOES_NOT_MEET: "Does Not Meet Standards",
        IMPROVEMENT_NEEDED: "Improvement Needed",
        MEETS_EXPECTATIONS: "Meets Expectations",
        EXCEEDS_EXPECTATIONS: "Exceeds Expectations",
        OUTSTANDING: "Outstanding",
    };
    return labels[rating] || rating;
}

export function getRatingDescription(rating: string): string {
    const descriptions: Record<string, string> = {
        DOES_NOT_MEET:
            "Performs below expectations and does not deliver expected impact and results.",
        IMPROVEMENT_NEEDED:
            "Meets some but not all expectations and needs improvement to deliver expected impact and results.",
        MEETS_EXPECTATIONS:
            "Consistently meets expectations and delivers expected impact and results.",
        EXCEEDS_EXPECTATIONS:
            "Goes above and beyond and delivers greater than expected value and results.",
        OUTSTANDING:
            "Sets the standard for extraordinary performance and delivers exceptional impact and results at the highest level.",
    };
    return descriptions[rating] || "";
}

export function getRatingColor(rating: string): string {
    const colors: Record<string, string> = {
        DOES_NOT_MEET: "text-red-600 bg-red-50 border-red-200",
        IMPROVEMENT_NEEDED: "text-orange-600 bg-orange-50 border-orange-200",
        MEETS_EXPECTATIONS: "text-blue-600 bg-blue-50 border-blue-200",
        EXCEEDS_EXPECTATIONS: "text-green-600 bg-green-50 border-green-200",
        OUTSTANDING: "text-purple-600 bg-purple-50 border-purple-200",
    };
    return colors[rating] || "text-gray-600 bg-gray-50 border-gray-200";
}

export function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        ADMIN: "Admin",
        WIS: "Developer",
        QC: "QC Engineer",
        PC: "Project Coordinator",
    };
    return labels[role] || role;
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + "...";
}

export function daysAgo(date: Date | string): number {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isWithinQuietHours(
    quietStart?: number | null,
    quietEnd?: number | null
): boolean {
    if (quietStart === null || quietStart === undefined) return false;
    if (quietEnd === null || quietEnd === undefined) return false;

    const now = new Date();
    const currentHour = now.getHours();

    if (quietStart < quietEnd) {
        return currentHour >= quietStart && currentHour < quietEnd;
    } else {
        // Quiet hours span midnight
        return currentHour >= quietStart || currentHour < quietEnd;
    }
}
