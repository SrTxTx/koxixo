import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Se está logado e tenta acessar login, redireciona para dashboard
    if (pathname === "/login" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
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