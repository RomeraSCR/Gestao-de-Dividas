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

export function DividaDialog({ open, onOpenChange, divida, onSuccess }: DividaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [valorParcelaDigits, setValorParcelaDigits] = useState("0")
  const [formData, setFormData] = useState<DividaFormData>({
    autor: "",
    produto: "",
    loja: "",
    data_fatura: "",
    total_parcelas: 1,
    parcelas_pagas: 0,
    valor_parcela: 0,
    valor_variavel: false,
  })

  useEffect(() => {
    if (open) {
      // Reset step quando abre o dialog
      setStep(1)
    }
    
    if (divida) {
      setFormData({
        autor: divida.autor,
        produto: divida.produto,
        loja: divida.loja,
        data_fatura: divida.data_fatura,
        total_parcelas: divida.total_parcelas,
        parcelas_pagas: divida.parcelas_pagas,
        valor_parcela: divida.valor_parcela,
        valor_variavel: divida.valor_variavel || false,
      })
      setValorParcelaDigits(String(toCents(Number(divida.valor_parcela) || 0)))
    } else {
      setFormData({
        autor: "",
        produto: "",
        loja: "",
        data_fatura: "",
        total_parcelas: 1,
        parcelas_pagas: 0,
        valor_parcela: 0,
        valor_variavel: false,
      })
      setValorParcelaDigits("0")
    }
  }, [divida, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Só submeter se estiver na etapa 2
    if (step !== 2) {
      return
    }
    
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
                       formData.data_fatura !== ""

  // Validação da etapa 2
  const isStep2Valid = formData.total_parcelas >= 1 && 
                       formData.valor_parcela > 0 && 
                       formData.parcelas_pagas >= 0 && 
                       formData.parcelas_pagas <= formData.total_parcelas

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
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? "bg-gradient-to-r from-blue-500 to-pink-500" : "bg-muted"}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? "bg-gradient-to-r from-blue-500 to-pink-500" : "bg-muted"}`} />
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
              <div className="grid gap-2">
                <Label htmlFor="data_fatura">Data da Fatura</Label>
                <Input
                  id="data_fatura"
                  type="date"
                  required
                  value={formData.data_fatura}
                  onChange={(e) => setFormData({ ...formData, data_fatura: e.target.value })}
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
                    const finalCents = cents >= 1 ? cents : 1 // mínimo 0,01
                    setValorParcelaDigits(String(finalCents))
                    setFormData((prev) => ({ ...prev, valor_parcela: fromCents(finalCents) }))
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="total_parcelas">Total de Parcelas</Label>
                  <Input
                    id="total_parcelas"
                    type="text"
                    inputMode="numeric"
                    min="1"
                    required
                    placeholder="12"
                    value={formData.total_parcelas === 0 ? "" : formData.total_parcelas.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setFormData({ ...formData, total_parcelas: 0 })
                        return
                      }
                      const numericValue = value.replace(/\D/g, "")
                      if (numericValue === "") {
                        setFormData({ ...formData, total_parcelas: 0 })
                        return
                      }
                      const parsed = Number.parseInt(numericValue, 10)
                      if (!isNaN(parsed) && parsed >= 1) {
                        setFormData({ ...formData, total_parcelas: parsed })
                      }
                    }}
                    onBlur={() => {
                      if (formData.total_parcelas < 1) {
                        setFormData({ ...formData, total_parcelas: 1 })
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parcelas_pagas">Parcelas Pagas</Label>
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
                    Valor Total:{" "}
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
                  className="bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:from-blue-600 hover:to-pink-600"
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
                  className="bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:from-blue-600 hover:to-pink-600"
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
