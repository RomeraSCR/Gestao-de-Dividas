"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { Divida, DividaFormData } from "@/lib/types"
import { createDivida, updateDivida } from "@/app/dashboard/actions"
import { digitsToCents, formatCentsPtBr, fromCents, mulMoney, toCents } from "@/lib/money"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface DividaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  divida: Divida | null
  onSuccess: () => void
}

function getYearMonth(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  return dateStr.substring(0, 7) // YYYY-MM
}

function getDayPart(dateStr: string | null | undefined): number {
  if (!dateStr) return 10 // padrão
  const parts = dateStr.split("-")
  if (parts.length === 3) {
    return Number(parts[2]) || 10
  }
  return 10
}

function calculateMonths(first: string, last: string): number {
  if (!first || !last) return 1
  const [y1, m1] = first.split("-").map(Number)
  const [y2, m2] = last.split("-").map(Number)
  if (isNaN(y1) || isNaN(m1) || isNaN(y2) || isNaN(m2)) return 1
  const diff = (y2 - y1) * 12 + (m2 - m1) + 1
  return diff >= 1 ? diff : 1
}

function getMonthNamePT(yearMonth: string) {
  if (!yearMonth) return ""
  const [year, month] = yearMonth.split("-").map(Number)
  const date = new Date(year, month - 1, 15)
  const monthName = date.toLocaleDateString("pt-BR", { month: "long" })
  return monthName.charAt(0).toUpperCase() + monthName.slice(1) + " de " + year
}

export function DividaDialog({ open, onOpenChange, divida, onSuccess }: DividaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [valorParcelaDigits, setValorParcelaDigits] = useState("0")
  
  const [firstPaymentMonth, setFirstPaymentMonth] = useState("")
  const [lastPaymentMonth, setLastPaymentMonth] = useState("")
  const [closingDay, setClosingDay] = useState(10)

  const [formData, setFormData] = useState<DividaFormData>({
    autor: "",
    produto: "",
    loja: "",
    data_fatura: "",
    total_parcelas: 1,
    parcelas_pagas: 0,
    valor_parcela: 0,
    valor_variavel: false,
    data_fechamento: "",
    data_inicio: "",
    data_fim: "",
  })

  useEffect(() => {
    if (open) {
      setStep(1)
    }
    
    if (divida) {
      const startMonth = getYearMonth(divida.data_inicio || divida.data_fatura)
      const endMonth = getYearMonth(divida.data_fim || divida.data_inicio || divida.data_fatura)
      const day = getDayPart(divida.data_fechamento || divida.data_fatura)

      setFirstPaymentMonth(startMonth)
      setLastPaymentMonth(endMonth)
      setClosingDay(day)

      setFormData({
        autor: divida.autor,
        produto: divida.produto,
        loja: divida.loja,
        data_fatura: divida.data_fatura,
        total_parcelas: divida.total_parcelas,
        parcelas_pagas: divida.parcelas_pagas,
        valor_parcela: divida.valor_parcela,
        valor_variavel: divida.valor_variavel || false,
        data_fechamento: divida.data_fechamento || "",
        data_inicio: divida.data_inicio || "",
        data_fim: divida.data_fim || "",
      })
      setValorParcelaDigits(String(toCents(Number(divida.valor_parcela) || 0)))
    } else {
      setFirstPaymentMonth("")
      setLastPaymentMonth("")
      setClosingDay(10)
      setFormData({
        autor: "",
        produto: "",
        loja: "",
        data_fatura: "",
        total_parcelas: 1,
        parcelas_pagas: 0,
        valor_parcela: 0,
        valor_variavel: false,
        data_fechamento: "",
        data_inicio: "",
        data_fim: "",
      })
      setValorParcelaDigits("0")
    }
  }, [divida, open])

  // Lógica central para atualizar as datas calculadas e o total de parcelas
  const handleDateFieldsChange = (first: string, last: string, day: number) => {
    if (first && last && day >= 1 && day <= 31) {
      const total = calculateMonths(first, last)
      const dayStr = String(day).padStart(2, "0")
      
      setFormData(prev => {
        const newTotal = total
        const newPaid = prev.parcelas_pagas > newTotal ? newTotal : prev.parcelas_pagas
        return {
          ...prev,
          total_parcelas: newTotal,
          parcelas_pagas: newPaid,
          data_inicio: `${first}-${dayStr}`,
          data_fim: `${last}-${dayStr}`,
          data_fechamento: `${first}-${dayStr}`,
          data_fatura: `${first}-${dayStr}`
        }
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step !== 2) return
    setIsLoading(true)

    try {
      const result = divida ? await updateDivida(divida.id, formData) : await createDivida(formData)

      if (result.error) {
        alert(result.error)
      } else {
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Erro ao salvar dívida:", error)
      alert("Erro ao salvar dívida")
    } finally {
      setIsLoading(false)
    }
  }

  // Validação da etapa 1
  const isStep1Valid = formData.autor.trim() !== "" && 
                       formData.produto.trim() !== "" && 
                       formData.loja.trim() !== "" && 
                       firstPaymentMonth !== "" &&
                       lastPaymentMonth !== "" &&
                       lastPaymentMonth >= firstPaymentMonth &&
                       closingDay >= 1 && closingDay <= 31

  // Validação da etapa 2
  const isStep2Valid = formData.total_parcelas >= 1 && 
                       formData.valor_parcela > 0 && 
                       formData.parcelas_pagas >= 0 && 
                       formData.parcelas_pagas <= formData.total_parcelas &&
                       formData.data_inicio !== "" &&
                       formData.data_fim !== ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{divida ? "Editar Dívida" : "Adicionar Nova Dívida"}</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Etapa 1 de 2: Informações da compra" : "Etapa 2 de 2: Valores e parcelas"}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de progresso */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* ETAPA 1: Informações da compra */}
          {step === 1 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="autor">Autor (Quem Comprou)</Label>
                <Input
                  id="autor"
                  required
                  autoFocus
                  placeholder="Ex: João, Maria..."
                  value={formData.autor}
                  onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="produto">Produto</Label>
                <Input
                  id="produto"
                  required
                  placeholder="Ex: iPhone 15, Geladeira..."
                  value={formData.produto}
                  onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loja">Loja</Label>
                <Input
                  id="loja"
                  required
                  placeholder="Ex: Amazon, Magazine Luiza..."
                  value={formData.loja}
                  onChange={(e) => setFormData({ ...formData, loja: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_payment_month">Primeiro Pagamento (Mês/Ano)</Label>
                  <Input
                    id="first_payment_month"
                    type="month"
                    required
                    value={firstPaymentMonth}
                    onChange={(e) => {
                      const val = e.target.value
                      setFirstPaymentMonth(val)
                      handleDateFieldsChange(val, lastPaymentMonth, closingDay)
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_payment_month">Último Pagamento (Mês/Ano)</Label>
                  <Input
                    id="last_payment_month"
                    type="month"
                    required
                    value={lastPaymentMonth}
                    onChange={(e) => {
                      const val = e.target.value
                      setLastPaymentMonth(val)
                      handleDateFieldsChange(firstPaymentMonth, val, closingDay)
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="closing_day">Dia de Fechamento da Fatura (1 a 31)</Label>
                <Input
                  id="closing_day"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="31"
                  required
                  placeholder="Ex: 10, 15..."
                  value={closingDay || ""}
                  onChange={(e) => {
                    const val = Math.min(31, Math.max(1, Number(e.target.value) || 1))
                    setClosingDay(val)
                    handleDateFieldsChange(firstPaymentMonth, lastPaymentMonth, val)
                  }}
                />
              </div>
            </div>
          )}

          {/* ETAPA 2: Valores e parcelas */}
          {step === 2 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="valor_parcela">Valor por Parcela (R$)</Label>
                <Input
                  id="valor_parcela"
                  type="text"
                  inputMode="decimal"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={formatCentsPtBr(digitsToCents(valorParcelaDigits), { useGrouping: true })}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "")
                    setValorParcelaDigits(digits)
                    const cents = digitsToCents(digits)
                    setFormData({ ...formData, valor_parcela: fromCents(cents) })
                  }}
                  onBlur={() => {
                    const cents = digitsToCents(valorParcelaDigits)
                    const finalCents = cents >= 1 ? cents : 1
                    setValorParcelaDigits(String(finalCents))
                    setFormData((prev) => ({ ...prev, valor_parcela: fromCents(finalCents) }))
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="total_parcelas">Parcelas Totais (Calculado)</Label>
                  <Input
                    id="total_parcelas"
                    disabled
                    className="bg-slate-100 dark:bg-slate-900 cursor-not-allowed opacity-80"
                    value={formData.total_parcelas.toString()}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parcelas_pagas">Parcelas Já Pagas</Label>
                  <Input
                    id="parcelas_pagas"
                    type="text"
                    inputMode="numeric"
                    min="0"
                    max={formData.total_parcelas}
                    required
                    placeholder="0"
                    value={formData.parcelas_pagas === 0 ? "0" : formData.parcelas_pagas.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setFormData({ ...formData, parcelas_pagas: 0 })
                        return
                      }
                      const numericValue = value.replace(/\D/g, "")
                      if (numericValue === "") {
                        setFormData({ ...formData, parcelas_pagas: 0 })
                        return
                      }
                      const parsed = Number.parseInt(numericValue, 10)
                      if (!isNaN(parsed) && parsed >= 0) {
                        const finalValue = parsed > formData.total_parcelas ? formData.total_parcelas : parsed
                        setFormData({ ...formData, parcelas_pagas: finalValue })
                      }
                    }}
                    onBlur={() => {
                      if (formData.parcelas_pagas < 0) {
                        setFormData({ ...formData, parcelas_pagas: 0 })
                      } else if (formData.total_parcelas > 0 && formData.parcelas_pagas > formData.total_parcelas) {
                        setFormData({ ...formData, parcelas_pagas: formData.total_parcelas })
                      }
                    }}
                  />
                </div>
              </div>

              {/* Pré-visualização do Cronograma */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-slate-700 dark:text-gray-300">📅 Cronograma de Cobrança:</p>
                <div className="flex justify-between">
                  <span>Início: {firstPaymentMonth ? getMonthNamePT(firstPaymentMonth) : "-"} (Dia {closingDay})</span>
                  <span>Último: {lastPaymentMonth ? getMonthNamePT(lastPaymentMonth) : "-"} (Dia {closingDay})</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="valor_variavel"
                  checked={formData.valor_variavel}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, valor_variavel: checked === true })
                  }
                />
                <Label
                  htmlFor="valor_variavel"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Valor variável por parcela
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6 -mt-2">
                Se marcado, você poderá definir valores diferentes para cada parcela ao pagar
              </p>
              {formData.valor_parcela > 0 && formData.total_parcelas > 0 && !formData.valor_variavel && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    Valor Total Contratado:{" "}
                    <span className="font-semibold text-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(mulMoney(formData.valor_parcela, formData.total_parcelas))}
                    </span>
                  </p>
                </div>
              )}
              {formData.valor_variavel && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 Com valor variável, você definirá o valor de cada parcela individualmente ao pagar
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isStep1Valid) {
                      setStep(2)
                    }
                  }}
                  disabled={!isStep1Valid}
                  className="bg-primary hover:opacity-95 text-primary-foreground"
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setStep(1)
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !isStep2Valid}
                  className="bg-primary hover:opacity-95 text-primary-foreground"
                >
                  {isLoading ? "Salvando..." : divida ? "Atualizar" : "Adicionar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
