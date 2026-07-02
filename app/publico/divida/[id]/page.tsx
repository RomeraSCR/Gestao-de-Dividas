import { query, queryOne } from "@/lib/db"
import { notFound } from "next/navigation"
import type { Divida } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Store, Calendar, User, CheckCircle2, Clock } from "lucide-react"
import { PublicComprovanteButton } from "./public-comprovante-button"

// Desabilita cache para acompanhamento em tempo real
export const dynamic = "force-dynamic"
export const revalidate = 0

type ParcelaValoresRow = {
  numero_parcela: number
  valor: number
}

type ParcelaPagamentosRow = {
  numero_parcela: number
  data_pagamento: string
  valor_pago: number
  comprovante_url: string | null
  comprovante_nome: string | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return "--/--/----"
  const parts = dateStr.split("T")[0].split("-")
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

export default async function PublicDividaPage(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  // 1. Carregar a dívida
  const divida = await queryOne<Divida>(
    "SELECT id, autor, produto, loja, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, COALESCE(valor_variavel, 0) as valor_variavel, data_fechamento, data_inicio, data_fim FROM dividas WHERE id = ?",
    [id]
  )

  if (!divida) {
    notFound()
  }

  // 2. Carregar os valores das parcelas
  const valores = await query<ParcelaValoresRow>(
    "SELECT numero_parcela, valor FROM parcelas_valores WHERE divida_id = ? ORDER BY numero_parcela ASC",
    [id]
  )

  // 3. Carregar os pagamentos das parcelas
  const pagamentos = await query<ParcelaPagamentosRow>(
    "SELECT numero_parcela, data_pagamento, valor_pago, comprovante_url, comprovante_nome FROM parcelas_pagamentos WHERE divida_id = ? ORDER BY numero_parcela ASC",
    [id]
  )

  // Calcular estatísticas
  const parcelasPagasNum = Number(divida.parcelas_pagas) || 0
  const totalParcelasNum = Number(divida.total_parcelas) || 0
  
  let valorTotal = 0
  let valorPago = 0

  if (divida.valor_variavel && valores.length > 0) {
    valorTotal = valores.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
    valorPago = valores
      .filter((v) => v.numero_parcela <= parcelasPagasNum)
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
  } else {
    const valorParcelaNum = Number(divida.valor_parcela) || 0
    valorTotal = valorParcelaNum * totalParcelasNum
    valorPago = valorParcelaNum * parcelasPagasNum
  }

  const valorRestante = Math.max(0, valorTotal - valorPago)
  const progresso = (parcelasPagasNum / totalParcelasNum) * 100
  const statusStr = parcelasPagasNum >= totalParcelasNum ? "QUITADA" : "EM ANDAMENTO"

  // Montar o histórico de parcelas
  const parcelasCompletas = Array.from({ length: totalParcelasNum }, (_, index) => {
    const num = index + 1
    const status = num <= parcelasPagasNum ? "paga" : "pendente"
    
    // Valor
    let valorParcela = Number(divida.valor_parcela) || 0
    if (divida.valor_variavel) {
      const customVal = valores.find((v) => v.numero_parcela === num)
      if (customVal) valorParcela = Number(customVal.valor) || 0
    }

    // Pagamento
    const pagamentoInfo = pagamentos.find((p) => p.numero_parcela === num)

    // Data de Vencimento
    let dueDate = ""
    if (divida.data_inicio) {
      const start = new Date(divida.data_inicio + "T12:00:00")
      start.setMonth(start.getMonth() + index)
      dueDate = start.toISOString().split("T")[0]
    }

    return {
      numero_parcela: num,
      status,
      valor: valorParcela,
      dueDate,
      pagamento: pagamentoInfo || null,
    }
  })

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] -z-10" />

      <Card className="w-full max-w-2xl glass-card shadow-2xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center pb-2 border-b border-border">
          <div className="flex justify-center mb-3">
            <Badge className={`text-xs px-3 py-1 font-bold ${parcelasPagasNum >= totalParcelasNum ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/15 text-blue-600 dark:text-blue-400"}`}>
              {statusStr}
            </Badge>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {divida.produto}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <Store className="h-3.5 w-3.5" />
              {divida.loja}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              Responsável: {divida.autor}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Progresso</span>
              <span>{parcelasPagasNum} de {totalParcelasNum} parcelas pagas ({progresso.toFixed(0)}%)</span>
            </div>
            <Progress value={progresso} className="h-3" />
          </div>

          {/* Money Summary Grid */}
          <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase">Valor Total</p>
              <p className="text-lg font-bold text-slate-800 dark:text-gray-100 mt-1">{formatCurrency(valorTotal)}</p>
            </div>
            <div className="text-center border-x border-slate-200 dark:border-slate-800">
              <p className="text-xs text-muted-foreground font-medium uppercase">Total Pago</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(valorPago)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase">Restante</p>
              <p className="text-lg font-bold text-destructive mt-1">{formatCurrency(valorRestante)}</p>
            </div>
          </div>

          {/* Installments List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Cronograma de Parcelas
            </h3>
            
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
              {parcelasCompletas.map((p) => {
                const isPaid = p.status === "paga"
                const dateLabel = p.dueDate ? formatDateBR(p.dueDate) : ""

                return (
                  <div key={p.numero_parcela} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isPaid ? "bg-emerald-500/5 border-emerald-500/10 dark:border-emerald-500/20" : "bg-card border-border"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isPaid ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600"}`}>
                        {isPaid ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Clock className="h-4.5 w-4.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-gray-100">Parcela {p.numero_parcela}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Vence em: {dateLabel}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className={`text-sm font-bold ${isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-gray-100"}`}>
                          {formatCurrency(p.valor)}
                        </p>
                        {isPaid && p.pagamento?.data_pagamento && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Pago: {formatDateBR(p.pagamento.data_pagamento)}
                          </p>
                        )}
                      </div>

                      {/* Comprovante Downloader */}
                      {isPaid && p.pagamento?.comprovante_url && (
                        <PublicComprovanteButton
                          dividaId={id}
                          comprovanteUrl={p.pagamento.comprovante_url}
                          comprovanteNome={p.pagamento.comprovante_nome || "Comprovante"}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
