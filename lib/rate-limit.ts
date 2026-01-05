// Simple in-memory rate limiter
// For production, consider using Redis or a database-backed solution

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    max: number;
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

export function rateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // Create new entry or reset if window expired
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 0,
            resetAt: now + config.windowMs,
        };
        rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.max) {
        return {
            success: false,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        success: true,
        remaining: config.max - entry.count,
        resetAt: entry.resetAt,
    };
}

// Predefined rate limit configs
export const rateLimitConfigs = {
    login: {
        max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || "5"),
        windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || "900000"), // 15 minutes
    },
    passwordReset: {
        max: parseInt(process.env.RATE_LIMIT_RESET_MAX || "3"),
        windowMs: parseInt(process.env.RATE_LIMIT_RESET_WINDOW_MS || "3600000"), // 1 hour
    },
};

export function checkLoginRateLimit(identifier: string): RateLimitResult {
    return rateLimit(`login:${identifier}`, rateLimitConfigs.login);
}

export function checkPasswordResetRateLimit(identifier: string): RateLimitResult {
    return rateLimit(`reset:${identifier}`, rateLimitConfigs.passwordReset);
}
