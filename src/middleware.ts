import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Rate limiting simples em memória (por IP + pathname)
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 min
const RATE_LIMIT_MAX = 30 // requests por janela
const SENSITIVE_LIMITS: Record<string, number> = {
  '/api/auth': 10, // login
  '/api/relatorios/export': 10, // export
}
const buckets = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string, pathname: string): boolean {
  const key = `${ip}:${pathname}`
  const now = Date.now()
  const max = SENSITIVE_LIMITS[pathname] ?? RATE_LIMIT_MAX
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (bucket.count >= max) return false
  bucket.count += 1
  return true
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Headers de segurança
    const res = NextResponse.next()
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('Permissions-Policy', "camera=(), microphone=(), geolocation=()")
    // CSP básica; ajuste conforme necessidade de fontes externas
    res.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none';")

    // Rate limit em rotas sensíveis
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/relatorios/export')) {
      if (!rateLimit(String(ip), pathname.startsWith('/api/auth') ? '/api/auth' : '/api/relatorios/export')) {
        return new NextResponse(JSON.stringify({ error: 'Muitas requisições, tente novamente em instantes.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
        })
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
        
        // Para outras páginas protegidas, requer token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico).*)",
  ]
}