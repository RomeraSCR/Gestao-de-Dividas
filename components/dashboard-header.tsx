"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/auth/actions"
import { LogOut, User, Info } from "lucide-react"
import { InstallBanner } from "@/components/install-banner"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { DonateDialog } from "@/components/donate-dialog"

interface DashboardHeaderProps {
  email: string | null
}

export function DashboardHeader({ email }: DashboardHeaderProps) {
  const router = useRouter()
  const isDemo = (email || "").toLowerCase().trim() === "demo@teste.com"

  const handleLogout = async () => {
    const result = await logout()
    if (result?.success && result.redirectTo) {
      router.push(result.redirectTo)
      router.refresh()
    }
  }

  const handleExitDemo = async () => {
    // 1) Logout (remove cookie)
    try {
      await logout()
    } catch {
      // ignore
    }

    // 2) Limpar dados locais (UX "limpo" ao sair do demo)
    try {
      localStorage.clear()
    } catch {
      // ignore
    }
    try {
      sessionStorage.clear()
    } catch {
      // ignore
    }
    // Cache Storage (PWA)
    try {
      if ("caches" in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch {
      // ignore
    }
    // Service Workers
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
    } catch {
      // ignore
    }

    // 3) Voltar para a Home com reload total
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-b border-white/20 dark:border-blue-500/30 shadow-lg dark:shadow-blue-500/10">
      <InstallBanner />
      {isDemo && (
        <div className="w-full border-b border-red-200/40 dark:border-red-500/25">
          <div className="bg-gradient-to-r from-red-600/25 via-rose-500/20 to-red-600/25 dark:from-red-500/15 dark:via-rose-500/10 dark:to-red-500/15 backdrop-blur-xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.18),inset_0_1px_0_rgba(0,0,0,0.06)]">
            <div className="container mx-auto max-w-7xl px-2 sm:px-4 py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 text-xs sm:text-sm text-red-950/90 dark:text-red-100">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-red-700/90 dark:text-red-200" />
                  <div className="min-w-0">
                    <span className="font-semibold">Você está em modo demonstração.</span>{" "}
                    <span className="text-red-900/80 dark:text-red-100/80">
                      Não insira dados reais ou informações sensíveis.
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExitDemo}
                  className="h-8 shrink-0 rounded-full border-red-300/60 bg-white/35 text-red-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur hover:bg-white/55 hover:border-red-300/80 dark:border-red-400/30 dark:bg-red-950/20 dark:text-red-100 dark:hover:bg-red-950/30"
                >
                  Sair do demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-2 sm:px-4 flex h-16 items-center justify-between max-w-7xl gap-2">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
          <Image
            src="/logo_circular.png"
            alt="Brasil Dívidas"
            width={44}
            height={44}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-lg dark:neon-glow shrink-0"
            priority
          />
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent leading-tight">
            <span className="block sm:inline">Gestão</span>{" "}
            <span className="block sm:inline">de Dívidas</span>
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <DonateDialog />
          <ThemeToggle />
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50 transition-all duration-300">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-pink-500">
                <User className="h-4 w-4 text-white" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-white/20 dark:border-blue-500/30">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium dark:text-gray-200">Minha Conta</p>
                {email && <p className="text-xs text-gray-600 dark:text-gray-400">{email}</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
