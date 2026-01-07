"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
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

interface PagarParcelaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  numeroParcela: number
  valorVariavel: boolean
  valorPadrao: number
  mesLabel: string
  dataLabel: string
  onConfirm: (params: { valorParcela?: number; comprovante?: File | null }) => Promise<void>
}

export function PagarParcelaDialog({
  open,
  onOpenChange,
  numeroParcela,
  valorVariavel,
  valorPadrao,
  mesLabel,
  dataLabel,
  onConfirm,
}: PagarParcelaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [valorDigits, setValorDigits] = useState(String(toCents(valorPadrao || 0)))
  const [comprovante, setComprovante] = useState<File | null>(null)

  const valorDisplay = useMemo(() => {
    if (!valorVariavel) return ""
    return formatCentsPtBr(digitsToCents(valorDigits), { useGrouping: true })
  }, [valorDigits, valorVariavel])

  useEffect(() => {
    if (!open) {
      setIsLoading(false)
      setComprovante(null)
      setValorDigits(String(toCents(valorPadrao || 0)))
    }
  }, [open, valorPadrao])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    try {
      let valorParcela: number | undefined = undefined
      if (valorVariavel) {
        const cents = digitsToCents(valorDigits)
        if (!cents || cents <= 0) {
          alert("Por favor, informe um valor válido")
          return
        }
        valorParcela = fromCents(cents)
      }

      await onConfirm({ valorParcela, comprovante })
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao pagar parcela:", error)
      alert("Erro ao pagar parcela")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[460px]"
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            Pagar parcela {numeroParcela} ({mesLabel} {dataLabel})
          </DialogTitle>
          <DialogDescription>
            Você pode anexar um comprovante opcionalmente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {valorVariavel && (
              <div className="grid gap-2">
                <Label htmlFor="valor">Valor da Parcela (R$)</Label>
                <Input
                  id="valor"
                  type="text"
                  inputMode="decimal"
                  required
                  value={valorDisplay}
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
            )}

            <div className="grid gap-2">
              <Label htmlFor="comprovante">Comprovante (opcional)</Label>
              <Input
                id="comprovante"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setComprovante(file)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Aceita PDF ou imagem (máx. 10MB).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Confirmar pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


