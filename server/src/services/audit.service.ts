import type { Request } from 'express';
import { prisma, type Tx } from '../lib/prisma';

/** Write an audit log entry. Used for every payment, booking and pricing change. */
export async function audit(
  params: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    details?: unknown;
    req?: Request;
  },
  tx: Tx | typeof prisma = prisma,
) {
  const json = (v: unknown) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  await tx.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      before: json(params.before),
      after: json(params.after ?? params.details),
      ip: params.req?.ip,
      userAgent: params.req?.get('user-agent')?.slice(0, 300),
    },
  });
}

