import { NextResponse } from 'next/server'

// Padrão de resposta de erro
export function apiError(status: number, error: string, opts?: { message?: string; code?: string }) {
  return NextResponse.json({ error, ...(opts?.message ? { message: opts.message } : {}), ...(opts?.code ? { code: opts.code } : {}) }, { status })
}

// Timeout helper para operações async (ex.: Prisma)
export async function withTimeout<T>(promise: Promise<T>, ms: number, message = 'Tempo limite excedido') {
  let timer: any
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

// Mapear papéis e permissões
type Role = 'ADMIN' | 'VENDEDOR' | 'ORCAMENTO' | 'PRODUCAO'

export const can = {
  editOrder: (role: Role, createdById: number, userId: number, status: string) => {
    if (!['PENDING', 'REJECTED'].includes(status)) return false
    if (role === 'ADMIN' || role === 'ORCAMENTO') return true
    if (role === 'VENDEDOR') return createdById === userId
    return false
  },
  approveOrder: (role: Role) => ['ADMIN', 'ORCAMENTO'].includes(role),
  rejectOrder: (role: Role) => ['ADMIN', 'ORCAMENTO'].includes(role),
  startProduction: (role: Role) => ['ADMIN', 'PRODUCAO'].includes(role),
  completeProduction: (role: Role) => ['ADMIN', 'PRODUCAO'].includes(role),
  deliverOrder: (role: Role) => ['ADMIN', 'VENDEDOR'].includes(role),
  resubmitOrder: (role: Role) => ['ADMIN', 'VENDEDOR'].includes(role),
}
