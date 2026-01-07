"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, CreditCard, CalendarDays } from "lucide-react"
import type { Divida } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { addMonths } from "date-fns"
import { mulMoney, sumMoney } from "@/lib/money"
import { MesDetalhesDialog } from "@/components/mes-detalhes-dialog"

interface DividasStatsProps {
  dividas: Divida[]
}

interface ValoresParcelas {
  [dividaId: string]: { numero_parcela: number; valor: number }[]
}

export function DividasStats({ dividas }: DividasStatsProps) {
  const [valoresParcelas, setValoresParcelas] = useState<ValoresParcelas>({})
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedMes, setSelectedMes] = useState<{ key: string; label: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadValores = async () => {
      const valores: ValoresParcelas = {}
      
      // Buscar valores para todas as dívidas com valor variável
      const promises = dividas
        .filter((d) => d.valor_variavel)
        .map(async (divida) => {
          try {
            const response = await fetch(`/api/parcelas-valores?divida_id=${divida.id}`)
            if (response.ok) {
              const valoresParcela = await response.json()
              valores[divida.id] = valoresParcela
            }
          } catch (error) {
            console.error(`Erro ao carregar valores para dívida ${divida.id}:`, error)
          }
        })

      await Promise.all(promises)
      setValoresParcelas(valores)
      setIsLoading(false)
    }

    loadValores()
  }, [dividas])

  const calcularValorDivida = (divida: Divida) => {
    if (divida.valor_variavel && valoresParcelas[divida.id]?.length > 0) {
      // Usar valores reais das parcelas
      const valores = valoresParcelas[divida.id]
      const valorTotal = sumMoney(valores.map((p) => Number(p.valor) || 0))
      const valorPago = sumMoney(valores.filter((p) => p.numero_parcela <= divida.parcelas_pagas).map((p) => Number(p.valor) || 0))
      const valorRestante = valorTotal - valorPago
      return { valorTotal, valorPago, valorRestante }
    } else {
      // Usar cálculo padrão
      const valorParcela = Number(divida.valor_parcela) || 0
      const totalParcelas = Number(divida.total_parcelas) || 0
      const parcelasPagas = Number(divida.parcelas_pagas) || 0
      
      const valorTotal = mulMoney(valorParcela, totalParcelas)
      const valorPago = mulMoney(valorParcela, parcelasPagas)
      const valorRestante = mulMoney(valorParcela, Math.max(0, totalParcelas - parcelasPagas))
      return { valorTotal, valorPago, valorRestante }
    }
  }

  const totalDividas = dividas.length

  const { totalAPagar, totalPago, totalGeral } = dividas.reduce(
    (acc, divida) => {
      const { valorTotal, valorPago, valorRestante } = calcularValorDivida(divida)
      return {
        totalAPagar: acc.totalAPagar + Math.max(0, valorRestante),
        totalPago: acc.totalPago + Math.max(0, valorPago),
        totalGeral: acc.totalGeral + Math.max(0, valorTotal),
      }
    },
    { totalAPagar: 0, totalPago: 0, totalGeral: 0 }
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const totalDividasText = String(totalDividas)
  const totalAPagarText = formatCurrency(totalAPagar)
  const totalPagoText = formatCurrency(totalPago)
  const totalGeralText = formatCurrency(totalGeral)

  const parseToDate = (dateValue: string | Date | null | undefined): Date | null => {
    if (!dateValue) return null
    if (dateValue instanceof Date) return dateValue
    const dateString = String(dateValue).trim()
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split("-")
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }
    const d = new Date(dateString)
    return isNaN(d.getTime()) ? null : d
  }

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

  const getValorParcelaNumero = (divida: Divida, numeroParcela: number) => {
    if (divida.valor_variavel && valoresParcelas[divida.id]?.length > 0) {
      const row = valoresParcelas[divida.id].find((p) => p.numero_parcela === numeroParcela)
      if (row?.valor) return Number(row.valor) || 0
    }
    return Number(divida.valor_parcela) || 0
  }

  const mensal = (() => {
    if (!mounted) {
      return { nowYear: 0, items: [] as { key: string; date: Date; total: number }[] }
    }

    const now = new Date()
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const totals = new Map<string, { date: Date; total: number }>()

    for (const divida of dividas) {
      const fatura = parseToDate(divida.data_fatura)
      if (!fatura) continue
      const start = Math.max(1, (Number(divida.parcelas_pagas) || 0) + 1)
      const end = Number(divida.total_parcelas) || 0
      if (end <= 0 || start > end) continue

      for (let numero = start; numero <= end; numero++) {
        const due = addMonths(fatura, numero - 1)
        const effective = due < startThisMonth ? startThisMonth : due
        const key = `${effective.getFullYear()}-${String(effective.getMonth() + 1).padStart(2, "0")}`
        const current = totals.get(key) || { date: effective, total: 0 }
        current.total = sumMoney([current.total, getValorParcelaNumero(divida, numero)])
        totals.set(key, current)
      }
    }

    const items = Array.from(totals.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 12)

    return {
      nowYear: now.getFullYear(),
      items,
    }
  })()

  return (
    <div className="mb-8 space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/20 dark:border-blue-500/30 shadow-xl dark:shadow-blue-500/10 dark:neon-border hover:shadow-2xl dark:hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">Total de Dívidas</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Wallet className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div
              className={cn(
                "font-bold bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent leading-none tracking-tight tabular-nums break-words overflow-hidden",
                "text-lg sm:text-xl md:text-2xl lg:text-3xl",
              )}
            >
              {totalDividasText}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">Compras parceladas ativas</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/20 dark:border-blue-500/30 shadow-xl dark:shadow-blue-500/10 dark:neon-border hover:shadow-2xl dark:hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">A Pagar</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div
              className={cn(
                "font-bold text-pink-600 dark:text-pink-400 leading-none tracking-tight tabular-nums break-words overflow-hidden",
                "text-sm sm:text-base md:text-lg lg:text-xl",
              )}
            >
              {totalAPagarText}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">Parcelas restantes</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/20 dark:border-blue-500/30 shadow-xl dark:shadow-blue-500/10 dark:neon-border hover:shadow-2xl dark:hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">Já Pago</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Image src="/logo_circular.png" alt="Brasil Dívidas" width={16} height={16} className="h-4 w-4 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div
              className={cn(
                "font-bold text-blue-600 dark:text-blue-400 leading-none tracking-tight tabular-nums break-words overflow-hidden",
                "text-sm sm:text-base md:text-lg lg:text-xl",
              )}
            >
              {totalPagoText}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">Parcelas quitadas</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/20 dark:border-blue-500/30 shadow-xl dark:shadow-blue-500/10 dark:neon-border hover:shadow-2xl dark:hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">Total Geral</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-blue-500">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div
              className={cn(
                "font-bold bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent leading-none tracking-tight tabular-nums break-words overflow-hidden",
                "text-sm sm:text-base md:text-lg lg:text-xl",
              )}
            >
              {totalGeralText}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">Valor total das compras</p>
          </CardContent>
        </Card>
      </div>

      <Card 
        className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/20 dark:border-blue-500/30 shadow-xl dark:shadow-blue-500/10 dark:neon-border"
        data-tour="stats-mensal"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-pink-500/15 border border-white/30 dark:border-blue-500/30">
              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </span>
            Total mensal a pagar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <p className="text-sm text-muted-foreground">Carregando resumo mensal…</p>
          ) : mensal.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem parcelas pendentes.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mensal.items.map((item) => {
                const monthName = capitalize(item.date.toLocaleDateString("pt-BR", { month: "long" }))
                const year = item.date.getFullYear()
                const label = year === mensal.nowYear ? monthName : `${monthName}/${year}`
                const isNext = item.key === mensal.items[0]?.key
                return (
                  <div
                    key={item.key}
                    onClick={() => setSelectedMes({ key: item.key, label })}
                    className={cn(
                      "relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all cursor-pointer",
                      "bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-slate-950/40 dark:via-slate-950/30 dark:to-slate-900/20",
                      "border-white/30 dark:border-blue-500/25",
                      "hover:shadow-md hover:-translate-y-0.5 hover:border-blue-400/50 dark:hover:border-blue-400/40",
                      isNext && "ring-1 ring-blue-500/30 dark:ring-blue-400/30",
                    )}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl",
                        isNext ? "bg-blue-500/20 dark:bg-blue-500/15" : "bg-pink-500/15 dark:bg-blue-600/10",
                      )}
                    />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{label}</span>
                          {isNext && (
                            <span className="text-[10px] leading-none px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                              Próximo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Valor total do mês</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={cn(
                            "font-bold tabular-nums tracking-tight",
                            isNext ? "text-blue-700 dark:text-blue-300" : "text-foreground",
                          )}
                        >
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {isLoading && (
            <p className="mt-2 text-xs text-muted-foreground">
              Carregando valores de parcelas variáveis…
            </p>
          )}
        </CardContent>
      </Card>

      <MesDetalhesDialog
        open={selectedMes !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMes(null)
        }}
        mesKey={selectedMes?.key || null}
        mesLabel={selectedMes?.label || ""}
        dividas={dividas}
        valoresParcelas={valoresParcelas}
      />
    </div>
  )
}
