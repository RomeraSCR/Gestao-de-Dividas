import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db"
import { DashboardContainer } from "@/components/dashboard-container"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { Divida, Receita, Gasto, Poupanca } from "@/lib/types"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
    return null
  }

  const dividas = await query<Divida>(
    "SELECT id, user_id, autor, produto, loja, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, COALESCE(valor_variavel, 0) as valor_variavel, data_fechamento, data_inicio, data_fim, created_at, updated_at FROM dividas WHERE user_id = ? ORDER BY data_fatura DESC",
    [user.id]
  )
  const dividasComBoolean = dividas.map(d => ({ ...d, valor_variavel: Boolean(d.valor_variavel) }))

  const receitas = await query<Receita>(
    "SELECT id, user_id, valor, descricao, data_receita, created_at FROM receitas WHERE user_id = ? ORDER BY data_receita DESC",
    [user.id]
  )
  const gastos = await query<Gasto>(
    "SELECT id, user_id, valor, descricao, categoria, data_gasto, tipo, created_at FROM gastos WHERE user_id = ? ORDER BY data_gasto DESC",
    [user.id]
  )
  const poupancas = await query<Poupanca>(
    "SELECT id, user_id, valor, descricao, data_poupanca, created_at FROM poupanca WHERE user_id = ? ORDER BY data_poupanca DESC",
    [user.id]
  )
  const parcelasValores = await query(
    "SELECT pv.divida_id, pv.numero_parcela, pv.valor FROM parcelas_valores pv JOIN dividas d ON d.id = pv.divida_id WHERE d.user_id = ?",
    [user.id]
  )
  const parcelasPagamentos = await query(
    "SELECT pp.divida_id, pp.numero_parcela, pp.valor_pago FROM parcelas_pagamentos pp JOIN dividas d ON d.id = pp.divida_id WHERE d.user_id = ?",
    [user.id]
  )

  return (
    <SidebarProvider>
      <div className="relative min-h-screen flex w-full bg-slate-50 dark:bg-slate-950">
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
    </SidebarProvider>
  )
}
