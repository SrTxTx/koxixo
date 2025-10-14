import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiting em memória com janela deslizante (sliding window) e chave composta (IP + userId + rota)
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 min
const DEFAULT_LIMIT = 60
const ROUTE_LIMITS: Record<string, number> = {
  '/api/auth': 15, // login
  '/api/relatorios/export': 10, // export pesado
}
// Estrutura: chave -> timestamps (ms)
const hitTimestamps = new Map<string, number[]>()

function normalizeRoute(pathname: string): string {
  // Normaliza rotas dinâmicas mais comuns
  if (pathname.startsWith('/api/pedidos/')) return '/api/pedidos/:id'
  if (pathname.startsWith('/api/auth')) return '/api/auth'
  if (pathname.startsWith('/api/relatorios/export')) return '/api/relatorios/export'
  if (pathname.startsWith('/api/relatorios')) return '/api/relatorios'
  return pathname
}

function rateLimitSliding(ip: string, userId: string, pathname: string) {
  const route = normalizeRoute(pathname)
  const limit = ROUTE_LIMITS[route] ?? DEFAULT_LIMIT
  const key = `${ip}:${userId}:${route}`
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const arr = hitTimestamps.get(key) || []
  // Limpa timestamps fora da janela
  const recent = arr.filter((t) => t > windowStart)
  if (recent.length >= limit) {
    // tempo até reset = (primeiro timestamp recente + janela) - agora
    const resetInMs = (recent[0] + RATE_LIMIT_WINDOW_MS) - now
    return { allowed: false, remaining: 0, limit, resetInMs: Math.max(0, resetInMs) }
  }
  recent.push(now)
  hitTimestamps.set(key, recent)
  return { allowed: true, remaining: Math.max(0, limit - recent.length), limit, resetInMs: RATE_LIMIT_WINDOW_MS }
}

// Upstash setup (optional)
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const upstashEnabled = !!(UPSTASH_URL && UPSTASH_TOKEN)
const upstashRedis = upstashEnabled ? new Redis({ url: UPSTASH_URL as string, token: UPSTASH_TOKEN as string }) : null
const upstashLimiters = new Map<number, Ratelimit>()
function getUpstashLimiter(limit: number) {
  if (!upstashEnabled || !upstashRedis) return null
  let rl = upstashLimiters.get(limit)
  if (!rl) {
    rl = new Ratelimit({ redis: upstashRedis, limiter: Ratelimit.slidingWindow(limit, '1 m') })
    upstashLimiters.set(limit, rl)
  }
  return rl
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Headers de segurança reforçados
    const res = NextResponse.next()
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('Permissions-Policy', "camera=(), microphone=(), geolocation=()")
    // CSP reforçada: downloads CSV/PDF são respostas de arquivo e não quebram a CSP do documento
    // Ajuste font-src se usar fontes externas.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      // Next.js requer unsafe-eval e unsafe-inline para dev/prod com webpack chunks
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self'",
      "frame-src 'none'",
      "form-action 'self'"
    ].join('; ')
    res.headers.set('Content-Security-Policy', csp)
    const proto = req.headers.get('x-forwarded-proto') || ''
    if (proto === 'https' || process.env.NODE_ENV === 'production') {
      res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    }

    // Rate limit com janela deslizante para todas as rotas /api, com limites específicos para rotas sensíveis
    if (pathname.startsWith('/api/')) {
      const ip = String(req.ip || req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
      const userId = String((token as any)?.id || (token as any)?.sub || 'anon')
      const route = normalizeRoute(pathname)
      const limit = ROUTE_LIMITS[route] ?? DEFAULT_LIMIT
      if (upstashEnabled) {
        const rl = getUpstashLimiter(limit)
        if (rl) {
          const key = `${ip}:${userId}:${route}`
          const { success, reset, remaining, limit: l } = await rl.limit(key)
          res.headers.set('X-RateLimit-Limit', String(l))
          res.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)))
          if (!success) {
            return new NextResponse(JSON.stringify({ error: 'Muitas requisições, tente novamente em instantes.' }), {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
                'X-RateLimit-Limit': String(l),
                'X-RateLimit-Remaining': '0',
              }
            })
          }
        }
      } else {
        const result = rateLimitSliding(ip, userId, pathname)
        res.headers.set('X-RateLimit-Limit', String(result.limit))
        res.headers.set('X-RateLimit-Remaining', String(result.remaining))
        if (!result.allowed) {
          return new NextResponse(JSON.stringify({ error: 'Muitas requisições, tente novamente em instantes.' }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil(result.resetInMs / 1000)),
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': '0',
            }
          })
        }
      }
    }

    // Se está logado e tenta acessar login, redireciona para dashboard
    if (pathname === "/login" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Permite acesso às páginas públicas
        if (pathname === "/login" || pathname === "/") return true

        // Para rotas de API, não forçar autenticação aqui; os handlers validam e retornam 401
        if (pathname.startsWith('/api/')) return true

        // Para outras páginas/rotas protegidas, requer token
        return !!token
      },
    },
  }
)

export const config = {
  // Aplicar em tudo exceto assets estáticos e Next internals
  matcher: [
    "/((?!_next/|.*\\.(?:ico|png|jpg|jpeg|svg|css|js)$).*)",
  ]
}