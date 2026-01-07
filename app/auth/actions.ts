"use server"

import { queryOne, query } from "@/lib/db"
import { setAuthToken, clearAuthToken } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Por favor, preencha todos os campos" }
  }

  try {
    const user = await queryOne<{
      id: string
      email: string
      password_hash: string
      nome: string
    }>("SELECT id, email, password_hash, nome FROM users WHERE email = ?", [email.toLowerCase().trim()])

    if (!user) {
      return { error: "Email ou senha incorretos" }
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return { error: "Email ou senha incorretos" }
    }

    try {
      await setAuthToken(user.id)
      console.log("[Auth] Token setado com sucesso para usuário:", user.id)
    } catch (tokenError) {
      console.error("[Auth] Erro ao setar token:", tokenError)
      return { error: "Erro ao criar sessão. Tente novamente." }
    }

    revalidatePath("/", "layout")
    return { success: true, redirectTo: "/dashboard" }
  } catch (error) {
    console.error("[Auth] Erro ao fazer login:", error)
    return { error: "Erro ao fazer login. Tente novamente." }
  }
}

export async function loginDemo() {
  const demoEmail = "demo@teste.com"
  try {
    const user = await queryOne<{ id: string; email: string; nome: string }>(
      "SELECT id, email, nome FROM users WHERE email = ?",
      [demoEmail]
    )

    if (!user) {
      return { error: "Conta de demonstração não encontrada" }
    }

    await setAuthToken(user.id)
    revalidatePath("/", "layout")
    return { success: true, redirectTo: "/dashboard" }
  } catch (error) {
    console.error("[Auth] Erro ao fazer login demo:", error)
    return { error: "Erro ao entrar no modo demonstração. Tente novamente." }
  }
}

export async function signup(formData: FormData) {
  const nome = formData.get("nome") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!nome?.trim()) {
    return { error: "Por favor, informe seu nome" }
  }

  if (!email || !password) {
    return { error: "Por favor, preencha todos os campos" }
  }

  if (password.length < 6) {
    return { error: "A senha deve ter no mínimo 6 caracteres" }
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem" }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: "Email inválido. Verifique e tente novamente." }
  }

  try {
    // Verificar se o email já existe
    const existingUser = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    )

    if (existingUser) {
      return { error: "Este email já está cadastrado. Tente fazer login." }
    }

    // Criar hash da senha
    const passwordHash = await bcrypt.hash(password, 10)
    const userId = randomUUID()
    const trimmedNome = nome.trim()
    const trimmedEmail = email.toLowerCase().trim()

    // Inserir usuário
    await query(
      "INSERT INTO users (id, email, password_hash, nome) VALUES (?, ?, ?, ?)",
      [userId, trimmedEmail, passwordHash, trimmedNome]
    )

    // Criar perfil
    await query(
      "INSERT INTO profiles (id, nome, email) VALUES (?, ?, ?)",
      [userId, trimmedNome, trimmedEmail]
    )

    // Limpar qualquer sessão anterior antes de fazer login com a nova conta
    await clearAuthToken()
    
    // Fazer login automaticamente
    await setAuthToken(userId)

    revalidatePath("/", "layout")
    return { success: true, redirectTo: "/dashboard" }
  } catch (error: any) {
    console.error("[Auth] Erro ao criar conta:", error)
    if (error.code === "ER_DUP_ENTRY") {
      return { error: "Este email já está cadastrado. Tente fazer login." }
    }
  return { error: "Erro ao criar conta. Tente novamente." }
  }
}

export async function logout() {
  await clearAuthToken()
  revalidatePath("/", "layout")
  return { success: true, redirectTo: "/" }
}
