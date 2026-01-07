import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { queryOne } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const COOKIE_NAME = "auth-token"

export interface User {
  id: string
  email: string
  nome: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const user = await queryOne<{
      id: string
      email: string
      nome: string
    }>(
      "SELECT id, email, nome FROM users WHERE id = ?",
      [decoded.userId]
    )

    return user ? { id: user.id, email: user.email, nome: user.nome } : null
  } catch (error) {
    return null
  }
}

export async function setAuthToken(userId: string): Promise<void> {
  try {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" })
    const cookieStore = await cookies()
    
    // Verificar se está usando HTTPS
    // Se o domínio começar com https:// ou tiver variável de ambiente indicando HTTPS
    const isHttps = process.env.HTTPS === "true" || 
                    process.env.NEXT_PUBLIC_HTTPS === "true"
    
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps, // Só usar secure se realmente estiver em HTTPS
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/", // Garantir que o cookie seja válido para todo o site
    })
    
    console.log("[Auth] Cookie setado:", { 
      userId, 
      isHttps, 
      hasToken: !!token,
      nodeEnv: process.env.NODE_ENV 
    })
  } catch (error) {
    console.error("[Auth] Erro ao setar token:", error)
    throw error
  }
}

export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
