import { AuditAction } from "@prisma/client";
import { prisma } from "./prisma";

export async function createAuditLog({
    actorUserId,
    action,
    entityType,
    entityId,
    beforeJson,
    afterJson,
}: {
    actorUserId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    beforeJson?: any;
    afterJson?: any;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                actorUserId,
                action,
                entityType,
                entityId,
                beforeJson: beforeJson || null,
                afterJson: afterJson || null,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't throw - audit logging should not break the main flow
    }
}

export async function getAuditLogs({
    entityType,
    entityId,
    actorUserId,
    limit = 50,
}: {
    entityType?: string;
    entityId?: string;
    actorUserId?: string;
    limit?: number;
}) {
    return prisma.auditLog.findMany({
        where: {
            ...(entityType && { entityType }),
            ...(entityId && { entityId }),
            ...(actorUserId && { actorUserId }),
        },
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
    });
}
