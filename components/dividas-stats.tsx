"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, CreditCard, CalendarDays, Eye, EyeOff } from "lucide-react"
import type { Divida } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { addMonths } from "date-fns"
import { mulMoney, sumMoney } from "@/lib/money"
import { MesDetalhesDialog } from "@/components/mes-detalhes-dialog"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts"

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
  const [showProjecaoTabela, setShowProjecaoTabela] = useState(false)

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
      const fatura = parseToDate(divida.data_inicio) || parseToDate(divida.data_fatura)
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

  // Calcular o valor do próximo mês (ou mês atual se houver faturas atrasadas)
  const totalMesAtualText = mounted && mensal.items.length > 0 
    ? formatCurrency(mensal.items[0].total) 
    : formatCurrency(0)

  // Formatar dados para o gráfico de projeção
  const chartData = mensal.items.map((item, index) => {
    const monthName = capitalize(item.date.toLocaleDateString("pt-BR", { month: "short" })).replace(".", "")
    const yearShort = String(item.date.getFullYear()).slice(-2)
    const label = capitalize(item.date.toLocaleDateString("pt-BR", { month: "long" })) + (item.date.getFullYear() === mensal.nowYear ? "" : `/${item.date.getFullYear()}`)
    return {
      key: item.key,
      label,
      name: `${monthName}/${yearShort}`,
      total: item.total,
      isNext: index === 0
    }
  })

  return (
    <div className="mb-8 space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">Total de Parcelamentos</CardTitle>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className={cn(
              "font-extrabold text-slate-900 dark:text-white leading-none tracking-tight tabular-nums break-words overflow-hidden",
              "text-lg sm:text-xl md:text-2xl lg:text-3xl"
            )}>
              {totalDividasText}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">Parcelamentos ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">A Pagar (Mês)</CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className={cn(
              "font-extrabold text-amber-600 dark:text-amber-400 leading-none tracking-tight tabular-nums break-words overflow-hidden",
              "text-sm sm:text-base md:text-lg lg:text-xl"
            )}>
              {totalMesAtualText}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">Próximas faturas</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">A Pagar (Total)</CardTitle>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className={cn(
              "font-extrabold text-red-600 dark:text-red-400 leading-none tracking-tight tabular-nums break-words overflow-hidden",
              "text-sm sm:text-base md:text-lg lg:text-xl"
            )}>
              {totalAPagarText}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">Parcelas restantes</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">Já Pago</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Image src="/logo_circular.png" alt="FinanzLivre Logo" width={16} height={16} className="h-4 w-4 rounded-full shrink-0 grayscale opacity-80" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className={cn(
              "font-extrabold text-emerald-600 dark:text-emerald-400 leading-none tracking-tight tabular-nums break-words overflow-hidden",
              "text-sm sm:text-base md:text-lg lg:text-xl"
            )}>
              {totalPagoText}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">Parcelas quitadas</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">Total Geral</CardTitle>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className={cn(
              "font-extrabold text-slate-900 dark:text-white leading-none tracking-tight tabular-nums break-words overflow-hidden",
              "text-sm sm:text-base md:text-lg lg:text-xl"
            )}>
              {totalGeralText}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">Valor total das compras</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <CalendarDays className="h-4 w-4" />
              </span>
              Projeção Mensal de Parcelas
            </CardTitle>
            <CardDescription className="text-sm">Gráfico de faturas estimadas para os próximos 12 meses</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProjecaoTabela(!showProjecaoTabela)}
            className="text-xs border-border text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {showProjecaoTabela ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                Ocultar Valores Numéricos
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Visualizar Valores Numéricos
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GRÁFICO DE PROJEÇÃO (Sempre visível por padrão!) */}
          <div className="h-[250px] w-full">
            {mounted ? (
              chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Nenhuma parcela pendente projetada.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "11px",
                      }}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(data) => {
                        if (data && data.key) {
                          setSelectedMes({ key: data.key, label: data.label })
                        }
                      }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isNext ? "var(--color-chart-2)" : "var(--primary)"} 
                          className="transition-all hover:opacity-85"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="h-full w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
            )}
          </div>

          {/* TABELA DE VALORES EM GRADE (Opcional, oculta por padrão!) */}
          {showProjecaoTabela && (
            <div className="pt-4 border-t border-border animate-fade-in">
              {!mounted ? (
                <p className="text-sm text-slate-500">Carregando resumo mensal…</p>
              ) : mensal.items.length === 0 ? (
                <p className="text-sm text-slate-500">Sem parcelas pendentes.</p>
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
                          "relative overflow-hidden rounded-lg border p-4 shadow-sm transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/20 border-border hover:border-slate-400 dark:hover:border-slate-700",
                          isNext && "ring-1 ring-emerald-500/30 dark:ring-emerald-400/30",
                        )}
                      >
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{label}</span>
                              {isNext && (
                                <span className="text-[10px] leading-none px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                  Próxima
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Valor total do mês</p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={cn(
                              "font-bold tabular-nums tracking-tight",
                              isNext ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200",
                            )}>
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
                <p className="mt-2 text-xs text-slate-500">
                  Carregando valores de parcelas variáveis…
                </p>
              )}
            </div>
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
