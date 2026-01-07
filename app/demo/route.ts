import { NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { setAuthToken } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const demoEmail = "demo@teste.com"
  const user = await queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", [demoEmail])
  const headers = request.headers
  const forwardedHost = (headers.get("x-forwarded-host") || headers.get("host") || "").split(",")[0]?.trim()
  const forwardedProto = (headers.get("x-forwarded-proto") || "").split(",")[0]?.trim()
  const fallbackOrigin = new URL(request.url).origin
  const origin = forwardedHost ? `${forwardedProto || "https"}://${forwardedHost}` : fallbackOrigin

  if (!user?.id) {
    return NextResponse.redirect(new URL("/auth/login", origin))
  }

  await setAuthToken(user.id)
  return NextResponse.redirect(new URL("/dashboard", origin))
}


