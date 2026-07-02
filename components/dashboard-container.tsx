"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Divida, Receita, Gasto, Poupanca } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CurrencyInput } from "@/components/ui/currency-input"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardHeaderShell } from "@/components/dashboard-header-shell"
import { DashboardUpdates } from "@/components/dashboard-updates"
import { ItemEditDialog } from "@/components/item-edit-dialog"
import {
  createReceita,
  deleteReceita,
  createGasto,
  deleteGasto,
  createPoupanca,
  deletePoupanca,
} from "@/app/dashboard/actions"
import { DividasList } from "@/components/dividas-list"
import { DividasStatsClient } from "@/components/dividas-stats-client"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ArrowRight,
  Info,
  BarChart3,
  FileText,
  FileDown,
  BookOpen,
  FileSpreadsheet,
  Edit,
} from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts"
import { generateMonthlyPDF, generateConsolidatedPDF } from "@/lib/pdf-generator"
import { exportReceitasCSV, exportGastosCSV, exportDividasCSV } from "@/lib/csv-generator"

const CATEGORY_COLORS: { [key: string]: string } = {
  "Alimentação": "#10b981", // emerald
  "Transporte": "#3b82f6", // blue
  "Lazer": "#a855f7", // purple
  "Saúde": "#ef4444", // red
  "Educação": "#6366f1", // indigo
  "Moradia": "#06b6d4", // cyan
  "Cartão de Crédito": "#eab308", // yellow
  "Financiamento": "#f97316", // orange
  "Guardar/Investir": "#14b8a6", // teal
  "Pix/Transferência": "#ec4899", // pink
  "Dívidas Parceladas": "#f43f5e", // rose
  "Outros": "#64748b", // slate
}

interface DashboardContainerProps {
  dividas: Divida[]
  receitas: Receita[]
  gastos: Gasto[]
  poupancas: Poupanca[]
  parcelasValores: any[]
  parcelasPagamentos: any[]
  userEmail?: string | null
}

const CATEGORIES = [
  { name: "Alimentação", color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  { name: "Transporte", color: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
  { name: "Lazer", color: "bg-purple-500", text: "text-purple-700 dark:text-purple-300" },
  { name: "Saúde", color: "bg-red-500", text: "text-red-700 dark:text-red-300" },
  { name: "Educação", color: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-300" },
  { name: "Moradia", color: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300" },
  { name: "Cartão de Crédito", color: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-300" },
  { name: "Financiamento", color: "bg-orange-500", text: "text-orange-700 dark:text-orange-300" },
  { name: "Guardar/Investir", color: "bg-teal-500", text: "text-teal-700 dark:text-teal-300" },
  { name: "Pix/Transferência", color: "bg-pink-500", text: "text-pink-700 dark:text-pink-300" },
  { name: "Outros", color: "bg-slate-500", text: "text-slate-700 dark:text-slate-300" },
]

export function DashboardContainer({
  dividas,
  receitas,
  gastos,
  poupancas,
  parcelasValores,
  parcelasPagamentos,
  userEmail,
}: DashboardContainerProps) {
  const [activeTab, setActiveTab] = useState<"resumo" | "dividas" | "controle" | "diarios" | "poupanca" | "relatorios">("resumo")
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editingType, setEditingType] = useState<"receita" | "gasto" | "poupanca">("receita")
  const [showFaturasMes, setShowFaturasMes] = useState(false)
  const router = useRouter()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Controle de Mês de Referência (YYYY-MM)
  const today = new Date()
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)

  // Estados dos Formulários
  const [recDesc, setRecDesc] = useState("")
  const [recVal, setRecVal] = useState("")
  const [recDate, setRecDate] = useState(new Date().toISOString().split("T")[0])

  const [gasDesc, setGasDesc] = useState("")
  const [gasVal, setGasVal] = useState("")
  const [gasCat, setGasCat] = useState("Alimentação")
  const [gasDate, setGasDate] = useState(new Date().toISOString().split("T")[0])

  const [pouDesc, setPouDesc] = useState("")
  const [pouVal, setPouVal] = useState("")
  const [pouDate, setPouDate] = useState(new Date().toISOString().split("T")[0])

  // Formatar Moeda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
  }

  // Navegar entre meses
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const newDate = new Date(year, month - 2, 1)
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`)
  }

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const newDate = new Date(year, month, 1)
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`)
  }

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number)
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  // ==========================================
  // FILTRAGEM DOS DADOS PARA O MÊS SELECIONADO
  // ==========================================

  // 1. Receitas
  const filteredReceitas = receitas.filter(r => r.data_receita.startsWith(selectedMonth))
  const totalReceitas = filteredReceitas.reduce((acc, r) => acc + Number(r.valor), 0)

  // 2. Gastos Mensais (Contas Fixas/Variáveis)
  const filteredGastosMensais = gastos.filter(g => g.tipo === "mensal" && g.data_gasto.startsWith(selectedMonth))
  const totalGastosMensais = filteredGastosMensais.reduce((acc, g) => acc + Number(g.valor), 0)

  // 3. Gastos Diários
  const filteredGastosDiarios = gastos.filter(g => g.tipo === "diario" && g.data_gasto.startsWith(selectedMonth))
  const totalGastosDiarios = filteredGastosDiarios.reduce((acc, g) => acc + Number(g.valor), 0)

  // 4. Poupança (Dinheiro Guardado)
  const filteredPoupancas = poupancas.filter(p => p.data_poupanca.startsWith(selectedMonth))
  const totalPoupancas = filteredPoupancas.reduce((acc, p) => acc + Number(p.valor), 0)

  // 5. Parcelas de Dívidas Ativas no Mês
  const parcelasDoMes: { divida: Divida; numero_parcela: number; valor: number; paga: boolean }[] = []
  
  dividas.forEach(divida => {
    const [selYear, selMonth] = selectedMonth.split("-").map(Number)
    const baseDateStr = divida.data_inicio || divida.data_fatura
    const faturaDate = new Date(baseDateStr + "T12:00:00") // evita fusos horários

    for (let i = 1; i <= divida.total_parcelas; i++) {
      const dueDate = new Date(faturaDate)
      dueDate.setMonth(faturaDate.getMonth() + i - 1)
      
      if (dueDate.getFullYear() === selYear && (dueDate.getMonth() + 1) === selMonth) {
        // Verificar se tem valor variável customizado cadastrado
        const customVal = parcelasValores.find(
          pv => pv.divida_id === divida.id && Number(pv.numero_parcela) === i
        )
        const valorParcela = customVal ? Number(customVal.valor) : Number(divida.valor_parcela)
        
        // Verificar se está paga
        const isPaga = i <= divida.parcelas_pagas

        parcelasDoMes.push({
          divida,
          numero_parcela: i,
          valor: valorParcela,
          paga: isPaga
        })
      }
    }
  })

  const totalParcelasMes = parcelasDoMes.reduce((acc, p) => acc + p.valor, 0)

  // ==========================================
  // CÁLCULO GERAL DO MÊS
  // ==========================================
  const totalSaidas = totalGastosMensais + totalGastosDiarios + totalParcelasMes
  const saldoFinal = totalReceitas - totalSaidas - totalPoupancas

  // Distribuição por Categorias (para gráficos rápidos)
  const categorySummary: { [key: string]: number } = {}
  
  // Somar gastos mensais e diários
  filteredGastosMensais.forEach(g => {
    categorySummary[g.categoria] = (categorySummary[g.categoria] || 0) + Number(g.valor)
  })
  filteredGastosDiarios.forEach(g => {
    categorySummary[g.categoria] = (categorySummary[g.categoria] || 0) + Number(g.valor)
  })
  // Somar parcelas de dívidas parceladas como categoria "Dívidas Parceladas"
  if (totalParcelasMes > 0) {
    categorySummary["Dívidas Parceladas"] = totalParcelasMes
  }
  // Somar poupanças como "Guardar/Investir"
  if (totalPoupancas > 0) {
    categorySummary["Guardar/Investir"] = (categorySummary["Guardar/Investir"] || 0) + totalPoupancas
  }

  const categorySorted = Object.entries(categorySummary)
    .map(([name, value]) => {
      const catDef = CATEGORIES.find(c => c.name === name)
      return {
        name,
        value,
        color: catDef?.color || "bg-slate-400",
        text: catDef?.text || "text-slate-600",
      }
    })
    .sort((a, b) => b.value - a.value)

  // ==========================================
  // MÉTODOS DE AÇÃO (CADASTRAR E EXCLUIR)
  // ==========================================
  
  const handleAddReceita = async (e: React.FormEvent) => {
    e.preventDefault()
    const valor = parseFloat(recVal.replace(",", "."))
    if (isNaN(valor) || valor <= 0 || !recDesc) return

    startTransition(async () => {
      const res = await createReceita({
        valor,
        descricao: recDesc,
        data_receita: recDate,
      })
      if (res.success) {
        setRecDesc("")
        setRecVal("")
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  const handleDeleteReceita = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta receita?")) return
    startTransition(async () => {
      const res = await deleteReceita(id)
      if (res.success) {
        router.refresh()
      }
    })
  }

  const handleAddGasto = async (e: React.FormEvent, tipo: "mensal" | "diario") => {
    e.preventDefault()
    const valor = parseFloat(gasVal.replace(",", "."))
    if (isNaN(valor) || valor <= 0 || !gasDesc) return

    startTransition(async () => {
      const res = await createGasto({
        valor,
        descricao: gasDesc,
        categoria: tipo === "mensal" ? "Outros" : gasCat, // Gastos mensais usam a categoria configurada ou "Outros" simplificado
        data_gasto: gasDate,
        tipo,
      })
      if (res.success) {
        setGasDesc("")
        setGasVal("")
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  const handleDeleteGasto = async (id: string) => {
    if (!confirm("Deseja realmente excluir este gasto?")) return
    startTransition(async () => {
      const res = await deleteGasto(id)
      if (res.success) {
        router.refresh()
      }
    })
  }

  const handleAddPoupanca = async (e: React.FormEvent) => {
    e.preventDefault()
    const valor = parseFloat(pouVal.replace(",", "."))
    if (isNaN(valor) || valor <= 0 || !pouDesc) return

    startTransition(async () => {
      const res = await createPoupanca({
        valor,
        descricao: pouDesc,
        data_poupanca: pouDate,
      })
      if (res.success) {
        setPouDesc("")
        setPouVal("")
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  const handleDeletePoupanca = async (id: string) => {
    if (!confirm("Deseja realmente excluir este lançamento de poupança?")) return
    startTransition(async () => {
      const res = await deletePoupanca(id)
      if (res.success) {
        router.refresh()
      }
    })
  }

  return (
    <>
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 flex flex-col relative w-full h-screen">
        <DashboardHeaderShell email={userEmail ?? null} />
        <main className="container mx-auto px-4 py-8 max-w-7xl flex-1">
          <div className="mb-8 flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-slate-900 dark:text-white tracking-tight">
                Dashboard Financeiro
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Controle suas receitas, despesas, parcelamentos e poupança</p>
            </div>
          </div>

          {/* SELETOR DE MÊS */}
          <div className="flex flex-col gap-6 mb-8 bg-card border border-border p-5 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handlePrevMonth}
                  className="h-9 w-9 rounded-full border border-border hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent text-slate-700 dark:text-slate-300"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center min-w-[160px]">
                  <h2 className="text-base font-bold capitalize text-slate-800 dark:text-gray-100">
                    {getMonthName(selectedMonth)}
                  </h2>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleNextMonth}
                  className="h-9 w-9 rounded-full border border-border hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent text-slate-700 dark:text-slate-300"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Selecione o mês para filtrar as informações
              </div>
            </div>
          </div>

      {/* ======================================================== */}
      {/* 1. ABA RESUMO GERAL                                      */}
      {/* ======================================================== */}
      {activeTab === "resumo" && (
        <div className="space-y-6 animate-fade-in">
          {/* CARDS DE TOPO */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-300">Receitas</span>
                  <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalReceitas)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Ganhos totais do mês</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-300">Total de Despesas</span>
                  <div className="h-9 w-9 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(totalSaidas)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Contas + Diários + Parcelas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-300">Dinheiro Guardado</span>
                  <div className="h-9 w-9 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrency(totalPoupancas)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Poupança e investimentos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card shadow border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Saldo Livre (Sobrou)</span>
                  <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className={`text-2xl font-bold ${saldoFinal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {formatCurrency(saldoFinal)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Quanto sobra para você usar</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DETALHAMENTO DE CÁLCULO E CATEGORIAS */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* O CÁLCULO FINANCEIRO */}
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20 flex flex-col justify-between">
              <div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    Cálculo do Mês
                  </CardTitle>
                  <CardDescription>Entenda como chegamos no saldo final</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-600 dark:text-gray-300">Total Recebido (+)</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(totalReceitas)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-600 dark:text-gray-300">Parcelas de Dívidas (-)</span>
                    <span className="font-semibold text-red-500">{formatCurrency(totalParcelasMes)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-600 dark:text-gray-300">Contas do Mês (-)</span>
                    <span className="font-semibold text-red-500">{formatCurrency(totalGastosMensais)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-600 dark:text-gray-300">Gastos Diários (-)</span>
                    <span className="font-semibold text-red-500">{formatCurrency(totalGastosDiarios)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-600 dark:text-gray-300">Dinheiro Guardado (-)</span>
                    <span className="font-semibold text-teal-600">{formatCurrency(totalPoupancas)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-slate-800 dark:text-gray-100 text-base">Saldo Líquido</span>
                    <span className={`text-lg font-bold ${saldoFinal >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>
                      {formatCurrency(saldoFinal)}
                    </span>
                  </div>
                </CardContent>
              </div>
              <CardContent className="pt-0">
                {/* Progress bar do orçamento */}
                {totalReceitas > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uso do Orçamento</span>
                      <span>{Math.min(100, Math.round(((totalSaidas + totalPoupancas) / totalReceitas) * 100))}%</span>
                    </div>
                    <Progress value={((totalSaidas + totalPoupancas) / totalReceitas) * 100} className="h-1.5 bg-slate-200 dark:bg-slate-800" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GRÁFICO COMPARATIVO */}
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Comparativo de Fluxo
                </CardTitle>
                <CardDescription>Entradas vs. Saídas deste mês</CardDescription>
              </CardHeader>
              <CardContent className="h-[240px]">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Entradas", valor: totalReceitas, fill: "#10b981" },
                        { name: "Saídas", valor: totalSaidas, fill: "#ef4444" },
                        { name: "Poupança", valor: totalPoupancas, fill: "#14b8a6" },
                        { name: "Sobrou", valor: Math.max(0, saldoFinal), fill: "#3b82f6" },
                      ]}
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                        {
                          [
                            { fill: "#10b981" },
                            { fill: "#ef4444" },
                            { fill: "#14b8a6" },
                            { fill: "#3b82f6" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
                )}
              </CardContent>
            </Card>

            {/* RESUMO POR CATEGORIAS */}
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-pink-500" />
                  Categorias
                </CardTitle>
                <CardDescription>Onde seu dinheiro está indo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySorted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <Info className="h-8 w-8 mb-2 opacity-50" />
                    <p>Nenhum gasto registrado neste mês.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Donut Chart */}
                    <div className="h-[120px] w-full flex items-center justify-center relative">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categorySorted.map(cat => ({
                                name: cat.name,
                                value: cat.value,
                              }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={38}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {categorySorted.map((cat, idx) => (
                                <Cell key={`cell-${idx}`} fill={CATEGORY_COLORS[cat.name] || "#64748b"} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => formatCurrency(Number(value))}
                              contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.9)",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                fontSize: "11px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-24 w-24 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Total</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-gray-100">{formatCurrency(totalSaidas + totalPoupancas)}</span>
                      </div>
                    </div>

                    {/* Progress bars list */}
                    <div className="max-h-[120px] overflow-y-auto pr-1 space-y-2">
                      {categorySorted.slice(0, 5).map((cat, index) => {
                        const totalGeralCategorias = totalSaidas + totalPoupancas
                        const percentage = totalGeralCategorias > 0 ? Math.round((cat.value / totalGeralCategorias) * 100) : 0
                        
                        return (
                          <div key={index} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-slate-700 dark:text-gray-300 flex items-center gap-1.5 truncate">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || "#64748b" }} />
                                {cat.name}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-gray-100 shrink-0">{formatCurrency(cat.value)} ({percentage}%)</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: CATEGORY_COLORS[cat.name] || "#64748b" }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* LISTA DE PARCELAS DO MÊS (COLAPSSÁVEL POR PADRÃO) */}
          <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-4 gap-4">
              <div>
                <CardTitle className="text-lg">Parcelamentos Vencendo em {getMonthName(selectedMonth)}</CardTitle>
                <CardDescription>Parcelas associadas aos seus parcelamentos ativos</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFaturasMes(!showFaturasMes)}
                className="text-xs border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 shrink-0"
              >
                {showFaturasMes ? "Ocultar" : "Visualizar"}
              </Button>
            </CardHeader>
            <CardContent>
              {!showFaturasMes ? (
                <p className="text-sm text-muted-foreground py-2 text-center sm:text-left">
                  Clique em <span className="font-semibold text-blue-600 dark:text-blue-400">"Visualizar"</span> para listar os parcelamentos individuais que vencem neste mês.
                </p>
              ) : (
                <>
                  {parcelasDoMes.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      Nenhuma parcela de compra parcelada cadastrada para este mês.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10 space-y-3">
                      {parcelasDoMes.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center pt-3 first:pt-0">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-gray-100">{p.divida.produto}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.divida.loja} • Parcela {p.numero_parcela} de {p.divida.total_parcelas}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-700 dark:text-gray-200">{formatCurrency(p.valor)}</span>
                            <Badge variant={p.paga ? "default" : "outline"} className={p.paga ? "bg-emerald-500 text-white" : "border-amber-500 text-amber-500"}>
                              {p.paga ? "Paga" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ABA DÍVIDAS PARCELADAS (VIEW ANTIGA INTEGRADA)         */}
      {/* ======================================================== */}
      {activeTab === "dividas" && (
        <div className="animate-fade-in space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100">Suas Compras Parceladas</h2>
              <p className="text-sm text-muted-foreground">Todas as dívidas divididas em várias parcelas</p>
            </div>
          </div>
          {/* Reutilizando as estatísticas e listagens originais do projeto */}
          <DividasStatsClient dividas={dividas} />
          <DividasList dividas={dividas} />
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ABA CONTROLE MENSAL (RECEITAS E CONTAS DO MÊS)        */}
      {/* ======================================================== */}
      {activeTab === "controle" && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          {/* RECEITAS */}
          <div className="space-y-6">
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Cadastrar Receita (Ganhos)
                </CardTitle>
                <CardDescription>Adicione quanto você recebeu no início do mês</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddReceita} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="recDesc">Descrição</Label>
                    <Input
                      id="recDesc"
                      required
                      placeholder="Ex: Salário, Freelance..."
                      value={recDesc}
                      onChange={e => setRecDesc(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="recVal">Valor (R$)</Label>
                      <Input
                        id="recVal"
                        required
                        type="text"
                        placeholder="0,00"
                        value={recVal}
                        onChange={e => setRecVal(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recDate">Data</Label>
                      <Input
                        id="recDate"
                        required
                        type="date"
                        value={recDate}
                        onChange={e => setRecDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isPending} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Receita
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-base">Receitas em {getMonthName(selectedMonth)}</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredReceitas.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma receita registrada neste mês.</p>
                ) : (
                  <div className="divide-y divide-white/10 space-y-3">
                    {filteredReceitas.map(r => (
                      <div key={r.id} className="flex justify-between items-center pt-3 first:pt-0">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-gray-100">{r.descricao}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(r.data_receita + "T12:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-600">{formatCurrency(r.valor)}</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-500" onClick={() => { setEditingItem(r); setEditingType("receita"); }}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDeleteReceita(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CONTAS DO MÊS (GASTOS MENSAIS) */}
          <div className="space-y-6">
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Cadastrar Conta do Mês
                </CardTitle>
                <CardDescription>Despesas fixas ou extras não parceladas deste mês</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={e => handleAddGasto(e, "mensal")} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="gasDesc">Descrição da Conta</Label>
                    <Input
                      id="gasDesc"
                      required
                      placeholder="Ex: Fatura Cartão Nubank, Energia, Pix para Fulano..."
                      value={gasDesc}
                      onChange={e => setGasDesc(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="gasVal">Valor (R$)</Label>
                      <Input
                        id="gasVal"
                        required
                        type="text"
                        placeholder="0,00"
                        value={gasVal}
                        onChange={e => setGasVal(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gasDate">Vencimento</Label>
                      <Input
                        id="gasDate"
                        required
                        type="date"
                        value={gasDate}
                        onChange={e => setGasDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isPending} className="w-full bg-red-600 text-white hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Conta
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-base">Contas Lançadas em {getMonthName(selectedMonth)}</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredGastosMensais.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma conta registrada neste mês.</p>
                ) : (
                  <div className="divide-y divide-white/10 space-y-3">
                    {filteredGastosMensais.map(g => (
                      <div key={g.id} className="flex justify-between items-center pt-3 first:pt-0">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-gray-100">{g.descricao}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Vence em {new Date(g.data_gasto + "T12:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-red-500">{formatCurrency(g.valor)}</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-500" onClick={() => { setEditingItem(g); setEditingType("gasto"); }}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDeleteGasto(g.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ABA GASTOS DIÁRIOS (LANÇAMENTOS DO DIA)                */}
      {/* ======================================================== */}
      {activeTab === "diarios" && (
        <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
          {/* FORMULÁRIO DE LANÇAMENTO */}
          <div className="md:col-span-1">
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Novo Gasto Diário
                </CardTitle>
                <CardDescription>Registre o que você gastou hoje</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={e => handleAddGasto(e, "diario")} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="gasDesc">O que gastou?</Label>
                    <Input
                      id="gasDesc"
                      required
                      placeholder="Ex: Gasolina, Padaria, Almoço..."
                      value={gasDesc}
                      onChange={e => setGasDesc(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gasVal">Valor (R$)</Label>
                    <Input
                      id="gasVal"
                      required
                      type="text"
                      placeholder="0,00"
                      value={gasVal}
                      onChange={e => setGasVal(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gasCat">Categoria</Label>
                    <select
                      id="gasCat"
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 dark:bg-slate-900/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={gasCat}
                      onChange={e => setGasCat(e.target.value)}
                    >
                      {CATEGORIES.filter(c => c.name !== "Dívidas Parceladas").map((cat, idx) => (
                        <option key={idx} value={cat.name} className="dark:bg-slate-900 text-slate-800 dark:text-gray-200">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gasDate">Data do Gasto</Label>
                    <Input
                      id="gasDate"
                      required
                      type="date"
                      value={gasDate}
                      onChange={e => setGasDate(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Gasto
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* HISTÓRICO DE GASTOS DIÁRIOS */}
          <div className="md:col-span-2">
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Gastos Diários de {getMonthName(selectedMonth)}</CardTitle>
                  <CardDescription>Histórico de despesas do dia a dia</CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm font-semibold">
                  Total: {formatCurrency(totalGastosDiarios)}
                </Badge>
              </CardHeader>
              <CardContent>
                {filteredGastosDiarios.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum gasto diário registrado neste mês.
                  </div>
                ) : (
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-700 dark:text-gray-300">
                      <thead className="text-xs uppercase bg-white/10 dark:bg-slate-900/40 text-slate-600 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-3">Data</th>
                          <th className="px-4 py-3">Descrição</th>
                          <th className="px-4 py-3">Categoria</th>
                          <th className="px-4 py-3 text-right">Valor</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredGastosDiarios.map(g => {
                          const catColor = CATEGORIES.find(c => c.name === g.categoria)?.color || "bg-slate-400"
                          return (
                            <tr key={g.id} className="hover:bg-white/5">
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {new Date(g.data_gasto + "T12:00:00").toLocaleDateString("pt-BR")}
                              </td>
                              <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-gray-100">{g.descricao}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className={`h-2.5 w-2.5 rounded-full ${catColor}`} />
                                  {g.categoria}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right font-bold text-slate-800 dark:text-gray-100">
                                {formatCurrency(g.valor)}
                              </td>
                              <td className="px-4 py-3.5 text-center flex items-center justify-center gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-500" onClick={() => { setEditingItem(g); setEditingType("gasto"); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDeleteGasto(g.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ABA POUPANÇA (DINHEIRO GUARDADO)                      */}
      {/* ======================================================== */}
      {activeTab === "poupanca" && (
        <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
          {/* FORMULÁRIO DE POUPANÇA */}
          <div className="md:col-span-1">
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-teal-500" />
                  Reservar Dinheiro
                </CardTitle>
                <CardDescription>Registre valores guardados ou investimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPoupanca} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pouDesc">Objetivo / Descrição</Label>
                    <Input
                      id="pouDesc"
                      required
                      placeholder="Ex: Reserva de Emergência, Viagem, Ações..."
                      value={pouDesc}
                      onChange={e => setPouDesc(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pouVal">Valor a Guardar (R$)</Label>
                    <Input
                      id="pouVal"
                      required
                      type="text"
                      placeholder="0,00"
                      value={pouVal}
                      onChange={e => setPouVal(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pouDate">Data do Aporte</Label>
                    <Input
                      id="pouDate"
                      required
                      type="date"
                      value={pouDate}
                      onChange={e => setPouDate(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isPending} className="w-full bg-teal-600 text-white hover:bg-teal-700 shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Guardar Dinheiro
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* HISTÓRICO DE POUPANÇA */}
          <div className="md:col-span-2">
            <Card className="glass-card shadow border-white/30 dark:border-blue-500/20 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Poupança em {getMonthName(selectedMonth)}</CardTitle>
                  <CardDescription>Dinheiro reservado no mês para o futuro</CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm font-semibold bg-teal-500/20 text-teal-700 dark:text-teal-300">
                  Total Guardado: {formatCurrency(totalPoupancas)}
                </Badge>
              </CardHeader>
              <CardContent>
                {filteredPoupancas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum valor reservado para poupança neste mês.
                  </div>
                ) : (
                  <div className="divide-y divide-white/10 space-y-3">
                    {filteredPoupancas.map(p => (
                      <div key={p.id} className="flex justify-between items-center pt-3 first:pt-0">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-gray-100">{p.descricao}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Aporte em {new Date(p.data_poupanca + "T12:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-teal-600">{formatCurrency(p.valor)}</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-500" onClick={() => { setEditingItem(p); setEditingType("poupanca"); }}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDeletePoupanca(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. ABA RELATÓRIOS                                        */}
      {/* ======================================================== */}
      {activeTab === "relatorios" && (
        <div className="space-y-6 animate-fade-in">
          {/* Overview Info Card */}
          <Card className="glass-card shadow border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-950/20 dark:to-purple-950/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
                Centro de Relatórios & Exportações
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Gere documentos detalhados de suas finanças em formatos portáteis (PDF) para impressão/arquivamento ou exporte dados em planilhas (CSV) para manipular em outros softwares.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <p className="text-xs text-muted-foreground font-medium uppercase">Receitas no Período</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalReceitas)}</p>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <p className="text-xs text-muted-foreground font-medium uppercase">Despesas no Período</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(totalSaidas)}</p>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <p className="text-xs text-muted-foreground font-medium uppercase">Total Guardado (Poupança)</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{formatCurrency(totalPoupancas)}</p>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <p className="text-xs text-muted-foreground font-medium uppercase">Saldo Líquido</p>
                <p className={`text-2xl font-bold mt-1 ${saldoFinal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(saldoFinal)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Relatório Mensal PDF Card */}
            <Card className="glass-card shadow border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                  <FileDown className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Relatório Mensal em PDF</CardTitle>
                <CardDescription>
                  Gera um extrato financeiro formal contendo todas as receitas, despesas fixas, gastos diários e faturas de parcelamentos do mês de <strong>{getMonthName(selectedMonth)}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => generateMonthlyPDF(
                    receitas, 
                    gastos, 
                    dividas, 
                    poupancas, 
                    parcelasValores, 
                    parcelasPagamentos, 
                    selectedMonth, 
                    userEmail || "usuario@finanzlivre.com"
                  )}
                >
                  <FileDown className="h-4 w-4" />
                  Baixar PDF Mensal
                </Button>
              </CardContent>
            </Card>

            {/* Relatório Consolidado Geral PDF Card */}
            <Card className="glass-card shadow border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-2">
                  <BookOpen className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Relatório Consolidado Geral</CardTitle>
                <CardDescription>
                  Gera um documento consolidado com o saldo geral acumulado de receitas/gastos, histórico de reservas de poupança e um <strong>balanço geral de todas as dívidas e parcelamentos ativos</strong>, detalhando o progresso de cada um.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => generateConsolidatedPDF(
                    dividas, 
                    receitas, 
                    gastos, 
                    poupancas, 
                    userEmail || "usuario@finanzlivre.com"
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  Baixar PDF Consolidado
                </Button>
              </CardContent>
            </Card>

            {/* CSV Planilhas Card */}
            <Card className="glass-card shadow border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Planilhas (CSV/Excel)</CardTitle>
                <CardDescription>
                  Exporte seus dados financeiros brutos em formato compatível com Excel e Google Sheets. Os arquivos contam com codificação adequada para exibição acentuada em português.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => exportReceitasCSV(receitas)}
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Exportar Receitas (CSV)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => exportGastosCSV(gastos)}
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Exportar Despesas (CSV)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => exportDividasCSV(dividas)}
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Exportar Parcelamentos (CSV)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <ItemEditDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        type={editingType}
        onSuccess={() => { router.refresh(); }}
      />
        </main>
        <DashboardUpdates />
      </div>
    </>
  )
}
