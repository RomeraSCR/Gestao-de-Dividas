"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Edit, Trash2, Store, Calendar, User, CheckCircle2 } from "lucide-react"
import type { Divida } from "@/lib/types"
import { deleteDivida, payNextParcelaWithComprovante } from "@/app/dashboard/actions"
import { useEffect, useState } from "react"
import { PagarParcelaDialog } from "@/components/pagar-parcela-dialog"
import { addMonths } from "date-fns"
import { HistoricoParcelasDialog } from "@/components/historico-parcelas-dialog"
import { mulMoney, sumMoney } from "@/lib/money"

interface DividaCardProps {
  divida: Divida
  onEdit: (divida: Divida) => void
  onSuccess: () => void
}

export function DividaCard({ divida, onEdit, onSuccess }: DividaCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [parcelasPagas, setParcelasPagas] = useState(divida.parcelas_pagas)
  const [showPagarDialog, setShowPagarDialog] = useState(false)
  const [showHistorico, setShowHistorico] = useState(false)
  const [valoresParcelas, setValoresParcelas] = useState<{ numero_parcela: number; valor: number }[]>([])

  useEffect(() => {
    setParcelasPagas(divida.parcelas_pagas)
    
    // Carregar valores das parcelas se for valor variável
    if (divida.valor_variavel) {
      loadValoresParcelas()
    } else {
      setValoresParcelas([])
    }
  }, [divida.parcelas_pagas, divida.id, divida.valor_variavel])

  const loadValoresParcelas = async () => {
    try {
      const response = await fetch(`/api/parcelas-valores?divida_id=${divida.id}`)
      if (response.ok) {
        const valores = await response.json()
        setValoresParcelas(valores)
      }
    } catch (error) {
      console.error("Erro ao carregar valores das parcelas:", error)
    }
  }

  // Calcular valores totais
  const calcularValores = () => {
    const valorParcela = Number(divida.valor_parcela) || 0
    const totalParcelas = Number(divida.total_parcelas) || 0
    const parcelasPagasNum = Number(parcelasPagas) || 0
    
    // Se for valor variável e temos valores carregados
    if (divida.valor_variavel && valoresParcelas.length > 0) {
      const valorTotal = sumMoney(valoresParcelas.map((p) => Number(p.valor) || 0))
      const valorPago = sumMoney(
        valoresParcelas.filter((p) => p.numero_parcela <= parcelasPagasNum).map((p) => Number(p.valor) || 0)
      )
      const valorRestante = Math.max(0, valorTotal - valorPago)
      return { valorTotal, valorPago, valorRestante }
    } else {
      // Para dívidas sem valor variável ou quando ainda não carregou os valores
      const valorTotal = mulMoney(valorParcela, totalParcelas)
      const valorRestante = Math.max(0, mulMoney(valorParcela, Math.max(0, totalParcelas - parcelasPagasNum)))
      return { valorTotal, valorPago: valorTotal - valorRestante, valorRestante }
    }
  }

  const { valorTotal, valorRestante } = calcularValores()
  const progresso = (parcelasPagas / divida.total_parcelas) * 100

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) {
      return "R$ 0,00"
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "Data inválida"
    
    try {
      let date: Date
      
      // Se já for um objeto Date
      if (dateValue instanceof Date) {
        date = dateValue
      } else {
        // Se for string, remove espaços
        const dateString = String(dateValue).trim()
        
        // Verifica se está no formato YYYY-MM-DD (formato MySQL DATE)
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split("-")
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        } else if (dateString.includes("T")) {
          // Formato ISO com horário
          date = new Date(dateString)
        } else {
          // Tenta parse direto
          date = new Date(dateString)
        }
      }
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.warn("Data inválida recebida:", dateValue)
        return "Data inválida"
      }
      
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateValue)
      return "Data inválida"
    }
  }

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

  const dataFaturaDate = parseToDate(divida.data_fatura)
  const dataPrimeiraParcela = dataFaturaDate
  const dataUltimaParcela =
    dataFaturaDate && divida.total_parcelas > 0 ? addMonths(dataFaturaDate, divida.total_parcelas - 1) : null
  const dataProximaParcela =
    dataFaturaDate && parcelasPagas < divida.total_parcelas ? addMonths(dataFaturaDate, parcelasPagas) : null

  const mesProximaParcela = dataProximaParcela
    ? capitalize(dataProximaParcela.toLocaleDateString("pt-BR", { month: "long" }))
    : "Mês"
  const mesProximaParcelaShort = dataProximaParcela
    ? capitalize(dataProximaParcela.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""))
    : "Mês"
  const diaMesProximaParcela = dataProximaParcela
    ? dataProximaParcela.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : "--/--"

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta dívida?")) return

    setIsDeleting(true)

    try {
      const result = await deleteDivida(divida.id)

      if (result.error) {
        alert(result.error)
      } else {
        onSuccess()
      }
    } catch (error) {
      console.error("Erro ao deletar dívida:", error)
      alert("Erro ao excluir dívida")
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePayNext = async () => {
    if (isPaying) return
    if (parcelasPagas >= divida.total_parcelas) return

    setShowPagarDialog(true)
  }

  const executePayParcela = async (params?: { valorParcela?: number; comprovante?: File | null }) => {
    if (isPaying) return
    if (parcelasPagas >= divida.total_parcelas) return

    // Otimista: já reflete no card
    const next = parcelasPagas + 1
    setParcelasPagas(next)
    setIsPaying(true)

    try {
      const fd = new FormData()
      fd.set("divida_id", divida.id)
      if (params?.valorParcela && params.valorParcela > 0) {
        fd.set("valor_parcela", String(params.valorParcela))
      }
      if (params?.comprovante) {
        fd.set("comprovante", params.comprovante)
      }

      const result = await payNextParcelaWithComprovante(fd)
      if (result?.error) {
        setParcelasPagas((prev) => Math.max(0, prev - 1))
        alert(result.error)
        return
      }
      
      // Recarregar valores das parcelas se for variável
      if (divida.valor_variavel) {
        await loadValoresParcelas()
      }
      
      onSuccess()
    } catch (error) {
      console.error("Erro ao pagar parcela:", error)
      setParcelasPagas((prev) => Math.max(0, prev - 1))
      alert("Erro ao pagar parcela")
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <Card 
      className="flex flex-col overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
      onClick={() => setShowHistorico(true)}
    >
      <CardHeader className="pb-3 min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <CardTitle className="text-base sm:text-lg font-semibold break-words line-clamp-2 min-w-0 flex-1">{divida.produto}</CardTitle>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowHistorico(true)
            }}
            className="shrink-0 group"
            aria-label="Abrir histórico de parcelas"
            title="Histórico"
          >
            <Badge
              variant={progresso === 100 ? "default" : "secondary"}
              className="cursor-pointer select-none"
            >
              <span className="group-hover:hidden group-focus-visible:hidden">
                {parcelasPagas}/{divida.total_parcelas}
              </span>
              <span className="hidden group-hover:inline group-focus-visible:inline">
                Histórico
              </span>
            </Badge>
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{divida.autor}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            <span>{divida.loja}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Fatura: {formatDate(divida.data_fatura)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>1ª parcela: {formatDate(dataPrimeiraParcela)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Última parcela: {formatDate(dataUltimaParcela)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.round(progresso)}%</span>
          </div>
          <Progress value={progresso} />
        </div>

        <div className="space-y-1 rounded-lg bg-muted p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {divida.valor_variavel ? "Valor médio por parcela:" : "Valor por parcela:"}
            </span>
            <span className="font-medium">{formatCurrency(divida.valor_parcela)}</span>
          </div>
          {divida.valor_variavel && (
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>💡 Valores podem variar por parcela</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{formatCurrency(valorTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total pago:</span>
            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(valorTotal - valorRestante)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Restante:</span>
            <span className="text-destructive">{formatCurrency(valorRestante)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          size="sm"
          className="w-full sm:flex-1 min-w-0 bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg transition-all hover:from-blue-600 hover:to-pink-600 disabled:opacity-60"
          onClick={(e) => {
            e.stopPropagation()
            handlePayNext()
          }}
          disabled={isPaying || parcelasPagas >= divida.total_parcelas}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {parcelasPagas >= divida.total_parcelas ? (
            "Quitado"
          ) : (
            <span className="min-w-0 truncate">
              Pagar{" "}
              <span className="hidden md:inline">{mesProximaParcela}</span>
              <span className="md:hidden">{mesProximaParcelaShort}</span>{" "}
              {diaMesProximaParcela}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto sm:flex-none bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(divida)
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          disabled={isDeleting}
          className="w-full sm:w-auto sm:flex-none"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>

      <PagarParcelaDialog
        open={showPagarDialog}
        onOpenChange={setShowPagarDialog}
        numeroParcela={parcelasPagas + 1}
        valorVariavel={Boolean(divida.valor_variavel)}
        valorPadrao={divida.valor_parcela}
        mesLabel={mesProximaParcela}
        dataLabel={diaMesProximaParcela}
        onConfirm={async ({ valorParcela, comprovante }) => {
          setShowPagarDialog(false)
          await executePayParcela({ valorParcela, comprovante })
        }}
      />

      <HistoricoParcelasDialog
        open={showHistorico}
        onOpenChange={setShowHistorico}
        dividaId={divida.id}
        titulo={divida.produto}
      />
    </Card>
  )
}
