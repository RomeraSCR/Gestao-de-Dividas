"use client"

import { useState } from "react"
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
import { digitsToCents, formatCentsPtBr, fromCents, toCents } from "@/lib/money"

interface ParcelaValorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  numeroParcela: number
  valorPadrao: number
  onConfirm: (valor: number) => Promise<void>
}

export function ParcelaValorDialog({
  open,
  onOpenChange,
  numeroParcela,
  valorPadrao,
  onConfirm,
}: ParcelaValorDialogProps) {
  const [valorDigits, setValorDigits] = useState(String(toCents(valorPadrao || 0)))
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const cents = digitsToCents(valorDigits)
      if (!cents || cents <= 0) {
        alert("Por favor, informe um valor válido")
        return
      }

      await onConfirm(fromCents(cents))
      onOpenChange(false)
      setValorDigits(String(toCents(valorPadrao || 0)))
    } catch (error) {
      console.error("Erro ao confirmar valor:", error)
      alert("Erro ao salvar valor da parcela")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Definir Valor da Parcela {numeroParcela}</DialogTitle>
          <DialogDescription>Informe o valor que será pago nesta parcela</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="valor">Valor da Parcela (R$)</Label>
              <Input
                id="valor"
                type="text"
                inputMode="decimal"
                required
                value={formatCentsPtBr(digitsToCents(valorDigits), { useGrouping: true })}
                onChange={(e) => {
                  setValorDigits(e.target.value.replace(/\D/g, ""))
                }}
                onBlur={() => {
                  const cents = digitsToCents(valorDigits)
                  setValorDigits(String(cents))
                }}
                placeholder="0,00"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Valor padrão sugerido:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valorPadrao)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
