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
      <div className="container mx-auto px-2 sm:px-4 flex h-16 items-center justify-between max-w-7xl gap-2">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
          <Image
            src="/logo_circular.png"
            alt="FinanzLivre Logo"
            width={44}
            height={44}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-sm shrink-0"
            priority
          />
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Finanz<span className="text-emerald-600 dark:text-emerald-400 font-black">Livre</span>
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <DonateDialog />
          <ThemeToggle />
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300">
              <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <User className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold dark:text-gray-200">Minha Conta</p>
                {email && <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>}
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
