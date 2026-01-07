import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db"
import { DashboardHeaderShell } from "@/components/dashboard-header-shell"
import { DividasList } from "@/components/dividas-list"
import { DividasStatsClient } from "@/components/dividas-stats-client"
import { DashboardUpdates } from "@/components/dashboard-updates"
import type { Divida } from "@/lib/types"

// Forçar renderização dinâmica - desabilita cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
    return null // TypeScript guard
  }

  const dividas = await query<Divida>(
    "SELECT id, user_id, autor, produto, loja, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, COALESCE(valor_variavel, 0) as valor_variavel, created_at, updated_at FROM dividas WHERE user_id = ? ORDER BY data_fatura DESC",
    [user.id]
  )
  
  // Converter valor_variavel de 0/1 para boolean
  const dividasComBoolean = dividas.map(d => ({
    ...d,
    valor_variavel: Boolean(d.valor_variavel)
  }))

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-pink-50 to-blue-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 -z-10" />

      {/* Floating orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/30 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse dark:neon-glow" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-pink-400/30 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000 dark:neon-glow" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-300/20 dark:bg-blue-400/15 rounded-full blur-3xl animate-pulse delay-500 dark:neon-glow" />
      </div>

      <DashboardHeaderShell email={user.email ?? null} />

      <main className="relative">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Gerencie suas dívidas e acompanhe os pagamentos</p>
          </div>

          <DividasStatsClient dividas={dividasComBoolean || []} />
          <DividasList dividas={dividasComBoolean || []} />
        </div>
      </main>

      {/* Notificação de atualização e Tour */}
      <DashboardUpdates />
    </div>
  )
}
