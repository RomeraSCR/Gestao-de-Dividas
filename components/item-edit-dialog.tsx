"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { updateReceita, updateGasto, updatePoupanca } from "@/app/dashboard/actions"

interface ItemEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: any
  type: "receita" | "gasto" | "poupanca"
  onSuccess: () => void
}

export function ItemEditDialog({ open, onOpenChange, item, type, onSuccess }: ItemEditDialogProps) {
  const [desc, setDesc] = useState("")
  const [val, setVal] = useState("")
  const [date, setDate] = useState("")
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (open && item) {
      setDesc(item.descricao || "")
      // Convert float to string like "1.400,00"
      const formatted = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(item.valor) || 0)
      setVal(formatted)
      
      if (type === "receita") setDate(item.data_receita?.substring(0, 10) || "")
      if (type === "gasto") setDate(item.data_gasto?.substring(0, 10) || "")
      if (type === "poupanca") setDate(item.data_poupanca?.substring(0, 10) || "")
    }
  }, [open, item, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    const cleanVal = val.replace(/\./g, "").replace(",", ".")
    const parsedVal = parseFloat(cleanVal)

    if (isNaN(parsedVal) || parsedVal <= 0 || !desc) {
      setIsPending(false)
      return
    }

    let res
    if (type === "receita") {
      res = await updateReceita(item.id, { valor: parsedVal, descricao: desc, data_receita: date })
    } else if (type === "gasto") {
      res = await updateGasto(item.id, { valor: parsedVal, descricao: desc, categoria: item.categoria, data_gasto: date, tipo: item.tipo })
    } else if (type === "poupanca") {
      res = await updatePoupanca(item.id, { valor: parsedVal, descricao: desc, data_poupanca: date })
    }

    setIsPending(false)

    if (res?.success) {
      onSuccess()
      onOpenChange(false)
    } else {
      alert(res?.error || "Erro ao atualizar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar {type === "receita" ? "Receita" : type === "gasto" ? "Gasto" : "Poupança"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input required value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Valor (R$)</Label>
            <CurrencyInput required value={val} onChange={setVal} placeholder="0,00" />
          </div>
          <div className="grid gap-2">
            <Label>Data</Label>
            <Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
