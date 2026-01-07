"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, Lock, User, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signup } from "@/app/auth/actions"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CadastroPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      const password = formData.get("password") as string
      const confirmPassword = formData.get("confirmPassword") as string

      if (password !== confirmPassword) {
        setError("As senhas não coincidem")
        setIsLoading(false)
        return
      }

      const result = await signup(formData)

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.success && result.redirectTo) {
        router.push(result.redirectTo)
        router.refresh()
        return
      }
    } catch (error: unknown) {
      setError("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-pink-50 to-blue-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 sm:p-6 md:p-8">
      <div className="animate-gradient absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-100/50 to-purple-100/50 dark:from-blue-950/50 dark:via-blue-900/50 dark:to-slate-900/50" />

      <div className="absolute left-[10%] top-[20%] h-48 w-48 animate-float rounded-full bg-gradient-to-br from-blue-300/40 to-blue-500/40 dark:from-blue-500/20 dark:to-blue-600/20 blur-3xl dark:neon-glow sm:h-64 sm:w-64" />
      <div
        className="absolute right-[10%] top-[30%] h-56 w-56 animate-float rounded-full bg-gradient-to-br from-pink-300/40 to-pink-500/40 dark:from-blue-600/20 dark:to-blue-700/20 blur-3xl dark:neon-glow sm:h-72 sm:w-72"
        style={{ animationDelay: "5s" }}
      />
      <div
        className="absolute bottom-[20%] left-[15%] h-40 w-40 animate-float rounded-full bg-gradient-to-br from-purple-300/30 to-blue-400/30 dark:from-blue-400/15 dark:to-blue-500/15 blur-3xl dark:neon-glow sm:h-56 sm:w-56"
        style={{ animationDelay: "10s" }}
      />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in px-4">
        <div
          className="glass-card animate-fade-in rounded-3xl p-6 shadow-2xl sm:p-8"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="mb-6 space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 sm:text-3xl">Criar conta</h2>
            <p className="text-sm text-slate-600 dark:text-gray-400">Preencha os dados abaixo</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Nome completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  disabled={isLoading}
                  autoComplete="name"
                  className="glass-input h-11 pl-10 text-slate-700 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="glass-input h-11 pl-10 text-slate-700 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="glass-input h-11 pl-10 text-slate-700 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="glass-input h-11 pl-10 text-slate-700 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Mínimo de 6 caracteres</p>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-blue-500 to-pink-500 dark:from-blue-500 dark:to-blue-600 text-base font-semibold text-white shadow-lg dark:neon-glow transition-all hover:from-blue-600 hover:to-pink-600 dark:hover:from-blue-400 dark:hover:to-blue-500 hover:shadow-xl disabled:opacity-50"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Criando conta...</span>
                </div>
              ) : (
                "Criar Conta"
              )}
            </Button>

            <div className="text-center text-sm text-slate-600 dark:text-gray-400">
              Já tem uma conta?{" "}
              <Link href="/auth/login?force=1" className="font-semibold text-blue-600 dark:text-blue-400 transition-colors hover:text-pink-600 dark:hover:text-blue-300">
                Fazer login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
