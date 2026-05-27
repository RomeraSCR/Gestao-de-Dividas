import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db"
import { DashboardHeaderShell } from "@/components/dashboard-header-shell"
import { DashboardContainer } from "@/components/dashboard-container"
import { DashboardUpdates } from "@/components/dashboard-updates"
import type { Divida, Receita, Gasto, Poupanca } from "@/lib/types"

// Forçar renderização dinâmica - desabilita cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
    return null // TypeScript guard
  }

  // 1. Dívidas parceladas
  const dividas = await query<Divida>(
    "SELECT id, user_id, autor, produto, loja, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, COALESCE(valor_variavel, 0) as valor_variavel, data_fechamento, data_inicio, data_fim, created_at, updated_at FROM dividas WHERE user_id = ? ORDER BY data_fatura DESC",
    [user.id]
  )
  
  // Converter valor_variavel de 0/1 para boolean
  const dividasComBoolean = dividas.map(d => ({
    ...d,
    valor_variavel: Boolean(d.valor_variavel)
  }))

  // 2. Receitas
  const receitas = await query<Receita>(
    "SELECT id, user_id, valor, descricao, data_receita, created_at FROM receitas WHERE user_id = ? ORDER BY data_receita DESC",
    [user.id]
  )

  // 3. Gastos (mensais e diários)
  const gastos = await query<Gasto>(
    "SELECT id, user_id, valor, descricao, categoria, data_gasto, tipo, created_at FROM gastos WHERE user_id = ? ORDER BY data_gasto DESC",
    [user.id]
  )

  // 4. Poupança
  const poupancas = await query<Poupanca>(
    "SELECT id, user_id, valor, descricao, data_poupanca, created_at FROM poupanca WHERE user_id = ? ORDER BY data_poupanca DESC",
    [user.id]
  )

  // 5. Valores e Pagamentos das Parcelas
  const parcelasValores = await query(
    "SELECT pv.divida_id, pv.numero_parcela, pv.valor FROM parcelas_valores pv JOIN dividas d ON d.id = pv.divida_id WHERE d.user_id = ?",
    [user.id]
  )

  const parcelasPagamentos = await query(
    "SELECT pp.divida_id, pp.numero_parcela, pp.valor_pago FROM parcelas_pagamentos pp JOIN dividas d ON d.id = pp.divida_id WHERE d.user_id = ?",
    [user.id]
  )

  return (
    <div className="relative min-h-screen">
      {/* Subtle clean background */}
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 -z-10" />

      <DashboardHeaderShell email={user.email ?? null} />

      <main className="relative">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-slate-900 dark:text-white tracking-tight">
              Dashboard Financeiro
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Controle suas receitas, despesas, parcelamentos e poupança</p>
          </div>

          <DashboardContainer
            dividas={dividasComBoolean || []}
            receitas={receitas || []}
            gastos={gastos || []}
            poupancas={poupancas || []}
            parcelasValores={parcelasValores || []}
            parcelasPagamentos={parcelasPagamentos || []}
            userEmail={user.email}
          />
        </div>
      </main>

      {/* Notificação de atualização e Tour */}
      <DashboardUpdates />
    </div>
  )
}
