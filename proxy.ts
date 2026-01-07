import { NextResponse, type NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const COOKIE_NAME = "auth-token"

export default async function proxy(request: NextRequest) {
  // Bloquear requisições do Vercel Analytics - retornar resposta vazia para evitar erros no console
  if (request.nextUrl.pathname.startsWith("/_vercel/insights")) {
    return new NextResponse('', { 
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  let user: { userId: string } | null = null

  if (token) {
    try {
      user = jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch {
      // Token inválido ou expirado
      user = null
    }
  }

  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (
    (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/cadastro")) &&
    user
  ) {
    // Permite acessar a tela de login/cadastro mesmo estando autenticado (ex.: trocar de conta)
    // Use /auth/login?force=1
    if (request.nextUrl.searchParams.get("force") === "1") {
      return NextResponse.next()
    }
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/_vercel/insights/:path*", // Bloquear especificamente o Vercel Analytics
  ],
}
