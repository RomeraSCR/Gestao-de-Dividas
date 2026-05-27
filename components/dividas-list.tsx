"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
  Info
} from "lucide-react"
import type { Divida } from "@/lib/types"
import { DividaDialog } from "@/components/divida-dialog"
import { DividaCard } from "@/components/divida-card"
import { useRouter } from "next/navigation"

interface DividasListProps {
  dividas: Divida[]
}

type SortOption = "date-desc" | "date-asc" | "value-desc" | "value-asc" | "name-asc"

export function DividasList({ dividas: initialDividas }: DividasListProps) {
  const router = useRouter()
  const [dividas, setDividas] = useState(initialDividas)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDivida, setSelectedDivida] = useState<Divida | null>(null)

  // Filtros, Busca e Paginação
  const [activeSubTab, setActiveSubTab] = useState<"ativas" | "quitadas">("ativas")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date-desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    setDividas(initialDividas)
  }, [initialDividas])

  const handleAdd = () => {
    setSelectedDivida(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (divida: Divida) => {
    setSelectedDivida(divida)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    router.refresh()
  }

  // 1. Filtrar por status (ativas / quitadas)
  const dividasFiltradasPorStatus = dividas.filter(d => {
    const isQuitada = d.parcelas_pagas >= d.total_parcelas
    return activeSubTab === "quitadas" ? isQuitada : !isQuitada
  })

  // 2. Filtrar por busca (query)
  const filteredAndSearched = dividasFiltradasPorStatus.filter(d => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      d.produto.toLowerCase().includes(query) ||
      d.loja.toLowerCase().includes(query) ||
      d.autor.toLowerCase().includes(query)
    )
  })

  // 3. Ordenar
  const sorted = [...filteredAndSearched].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.data_fatura).getTime() - new Date(a.data_fatura).getTime()
      case "date-asc":
        return new Date(a.data_fatura).getTime() - new Date(b.data_fatura).getTime()
      case "value-desc":
        return Number(b.valor_parcela) - Number(a.valor_parcela)
      case "value-asc":
        return Number(a.valor_parcela) - Number(b.valor_parcela)
      case "name-asc":
        return a.produto.localeCompare(b.produto)
      default:
        return 0
    }
  })

  // 4. Paginar
  const totalPages = Math.ceil(sorted.length / itemsPerPage)
  const pageIndex = Math.max(1, Math.min(currentPage, totalPages))
  const paginatedDividas = sorted.slice((pageIndex - 1) * itemsPerPage, pageIndex * itemsPerPage)

  // Resetar página quando mudar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [activeSubTab, searchQuery, sortBy])

  // Contagem para badges do menu
  const countAtivas = dividas.filter(d => d.parcelas_pagas < d.total_parcelas).length
  const countQuitadas = dividas.filter(d => d.parcelas_pagas >= d.total_parcelas).length

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Controle de Parcelamentos
            </CardTitle>
            <CardDescription>Gerencie suas compras parceladas de forma segmentada</CardDescription>
          </div>
          <Button
            onClick={handleAdd}
            className="w-full sm:w-auto bg-primary hover:opacity-95 text-primary-foreground shadow-sm transition-all duration-200 hover:scale-[1.01]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Parcelamento
          </Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* BARRA DE FILTROS E BUSCA */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-border">
            {/* SUB-TABS INTERNAS */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-850 rounded-lg border border-border max-w-fit">
              <Button
                size="sm"
                variant={activeSubTab === "ativas" ? "default" : "ghost"}
                onClick={() => setActiveSubTab("ativas")}
                className={`rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeSubTab === "ativas"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-border"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Em Andamento
                <Badge variant="secondary" className="ml-2 bg-slate-200 dark:bg-slate-800 text-slate-850 dark:text-slate-200">
                  {countAtivas}
                </Badge>
              </Button>
              <Button
                size="sm"
                variant={activeSubTab === "quitadas" ? "default" : "ghost"}
                onClick={() => setActiveSubTab("quitadas")}
                className={`rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeSubTab === "quitadas"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-border"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-450" />
                Quitadas
                <Badge variant="secondary" className="ml-2 bg-slate-200 dark:bg-slate-800 text-slate-850 dark:text-slate-200">
                  {countQuitadas}
                </Badge>
              </Button>
            </div>

            {/* CONTROLES DE BUSCA E ORDENAÇÃO */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <Input
                  placeholder="Buscar produto, loja ou autor..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-white/50 dark:bg-slate-900/50"
                />
              </div>
              <div className="relative flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-slate-400 dark:text-gray-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="flex h-10 w-full sm:w-[190px] rounded-md border border-input bg-white/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-800 dark:text-gray-100"
                >
                  <option value="date-desc">Mais recentes</option>
                  <option value="date-asc">Mais antigas</option>
                  <option value="value-desc">Maior valor</option>
                  <option value="value-asc">Menor valor</option>
                  <option value="name-asc">Nome (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* LISTAGEM DE CARD DE DÍVIDAS */}
          {paginatedDividas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <Info className="h-8 w-8 text-slate-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Nenhum parcelamento encontrado.</p>
              {searchQuery && <p className="text-sm text-muted-foreground mt-1">Tente ajustar o termo de busca.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 animate-fade-in">
              {paginatedDividas.map((divida, index) => (
                <div key={divida.id} data-tour={index === 0 ? "divida-card" : undefined}>
                  <DividaCard divida={divida} onEdit={handleEdit} onSuccess={handleSuccess} />
                </div>
              ))}
            </div>
          )}

          {/* CONTROLES DE PAGINAÇÃO */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DividaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        divida={selectedDivida}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
