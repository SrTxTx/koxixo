import { prisma } from '@/lib/prisma'

type AuditParams = {
  userId?: number | null
  action: string
  entity: string
  entityId: number
  from?: any
  to?: any
  meta?: Record<string, any>
}

export async function auditLog({ userId, action, entity, entityId, from, to, meta }: AuditParams) {
  try {
    await (prisma as any).auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId,
        from: from !== undefined ? JSON.stringify(from) : null,
        to: to !== undefined ? JSON.stringify(to) : null,
        meta: meta ? meta : undefined,
      },
    })
  } catch (e) {
    // Evitar que falhas de auditoria quebrem a operação principal
  }
}
