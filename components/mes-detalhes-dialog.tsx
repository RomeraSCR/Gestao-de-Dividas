"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarDays, Store, User, X, CheckCircle2, Clock } from "lucide-react"
import type { Divida } from "@/lib/types"
import { addMonths } from "date-fns"

interface ParcelaMes {
  divida: Divida
  numeroParcela: number
  valor: number
  vencimento: Date
  isPaga: boolean
}

interface MesDetalhesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mesKey: string | null
  mesLabel: string
  dividas: Divida[]
  valoresParcelas: { [dividaId: string]: { numero_parcela: number; valor: number }[] }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
}

function formatDateBR(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function parseToDate(dateValue: string | Date | null | undefined): Date | null {
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

export function MesDetalhesDialog({
  open,
  onOpenChange,
  mesKey,
  mesLabel,
  dividas,
  valoresParcelas,
}: MesDetalhesDialogProps) {
  const parcelas = useMemo(() => {
    if (!mesKey) return []

    const [targetYear, targetMonth] = mesKey.split("-").map(Number)
    const now = new Date()
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const result: ParcelaMes[] = []

    for (const divida of dividas) {
      const fatura = parseToDate(divida.data_fatura)
      if (!fatura) continue

      const totalParcelas = Number(divida.total_parcelas) || 0
      const parcelasPagas = Number(divida.parcelas_pagas) || 0

      for (let numero = 1; numero <= totalParcelas; numero++) {
        const due = addMonths(fatura, numero - 1)
        const effective = due < startThisMonth ? startThisMonth : due
        const effectiveKey = `${effective.getFullYear()}-${String(effective.getMonth() + 1).padStart(2, "0")}`

        if (effectiveKey === mesKey) {
          // Calcular valor da parcela
          let valor = Number(divida.valor_parcela) || 0
          if (divida.valor_variavel && valoresParcelas[divida.id]?.length > 0) {
            const row = valoresParcelas[divida.id].find((p) => p.numero_parcela === numero)
            if (row?.valor) valor = Number(row.valor) || 0
          }

          result.push({
            divida,
            numeroParcela: numero,
            valor,
            vencimento: due,
            isPaga: numero <= parcelasPagas,
          })
        }
      }
    }

    // Ordenar por vencimento e depois por produto
    return result.sort((a, b) => {
      const dateCompare = a.vencimento.getTime() - b.vencimento.getTime()
      if (dateCompare !== 0) return dateCompare
      return a.divida.produto.localeCompare(b.divida.produto)
    })
  }, [mesKey, dividas, valoresParcelas])

  const totalMes = parcelas.reduce((acc, p) => acc + p.valor, 0)
  const totalPagas = parcelas.filter((p) => p.isPaga).length
  const totalPendentes = parcelas.filter((p) => !p.isPaga).length

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-hidden flex flex-col sm:max-w-[600px] p-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        {/* Header fixo */}
        <div className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {mesLabel}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Parcelas a vencer neste mês
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full hover:bg-white/50 dark:hover:bg-slate-700"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800 border text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalMes)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-700 dark:text-green-300">{totalPagas} pagas</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-sm">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold text-amber-700 dark:text-amber-300">{totalPendentes} pendentes</span>
            </div>
          </div>
        </div>

        {/* Lista de parcelas com scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {parcelas.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-12">
              Nenhuma parcela neste mês.
            </div>
          ) : (
            <div className="space-y-2">
              {parcelas.map((p, idx) => {
                const isPaga = p.isPaga

                return (
                  <div
                    key={`${p.divida.id}-${p.numeroParcela}`}
                    className={`
                      rounded-xl border p-4 transition-all
                      ${isPaga
                        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                        : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Info da parcela */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`
                          flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-bold
                          ${isPaga
                            ? "bg-green-500 text-white"
                            : "bg-gradient-to-br from-blue-500 to-pink-500 text-white"
                          }
                        `}
                        >
                          {p.numeroParcela}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base truncate">{p.divida.produto}</span>
                            {isPaga && (
                              <Badge className="bg-green-600 text-white text-xs">Paga</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {p.divida.autor}
                            </span>
                            <span className="flex items-center gap-1">
                              <Store className="h-3 w-3" />
                              {p.divida.loja}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Venc.: {formatDateBR(p.vencimento)} • Parcela {p.numeroParcela}/{p.divida.total_parcelas}
                          </div>
                        </div>
                      </div>

                      {/* Valor */}
                      <div className="text-right shrink-0">
                        <div className={`font-bold text-lg tabular-nums ${isPaga ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                          {formatCurrency(p.valor)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

