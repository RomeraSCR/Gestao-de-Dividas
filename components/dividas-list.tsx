"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, CheckCircle2 } from "lucide-react"
import { Wallet } from "lucide-react"
import type { Divida } from "@/lib/types"
import { DividaDialog } from "@/components/divida-dialog"
import { DividaCard } from "@/components/divida-card"
import { useRouter } from "next/navigation"

interface DividasListProps {
  dividas: Divida[]
}

export function DividasList({ dividas: initialDividas }: DividasListProps) {
  const router = useRouter()
  const [dividas, setDividas] = useState(initialDividas)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDivida, setSelectedDivida] = useState<Divida | null>(null)

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

  // Separar dívidas ativas e quitadas
  const dividasAtivas = dividas.filter((d) => d.parcelas_pagas < d.total_parcelas)
  const dividasQuitadas = dividas.filter((d) => d.parcelas_pagas >= d.total_parcelas)

  return (
    <>
      {/* Dívidas Ativas */}
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/20 dark:border-blue-500/30 shadow-xl dark:shadow-blue-500/10 dark:neon-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
            Minhas Dívidas
          </CardTitle>
          <Button
            onClick={handleAdd}
            size="sm"
            data-tour="add-divida"
            className="bg-gradient-to-r from-blue-500 to-pink-500 dark:from-blue-500 dark:to-blue-600 hover:from-blue-600 hover:to-pink-600 dark:hover:from-blue-400 dark:hover:to-blue-500 text-white shadow-lg dark:neon-glow transition-all duration-300 hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {dividasAtivas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 p-6 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 dark:from-blue-900/30 dark:to-blue-800/30">
                <Wallet className="h-16 w-16 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="mb-6 text-gray-600 dark:text-gray-300 text-lg">Nenhuma dívida cadastrada ainda</p>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-500 to-pink-500 dark:from-blue-500 dark:to-blue-600 hover:from-blue-600 hover:to-pink-600 dark:hover:from-blue-400 dark:hover:to-blue-500 text-white shadow-lg dark:neon-glow transition-all duration-300 hover:scale-105"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeira dívida
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {dividasAtivas.map((divida, index) => (
                <div key={divida.id} data-tour={index === 0 ? "divida-card" : undefined}>
                  <DividaCard divida={divida} onEdit={handleEdit} onSuccess={handleSuccess} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dívidas Quitadas */}
      {dividasQuitadas.length > 0 && (
        <Card className="mt-6 backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 border-white/20 dark:border-blue-500/30 shadow-xl dark:shadow-blue-500/10 dark:neon-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              Dívidas Quitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {dividasQuitadas.map((divida) => (
                <DividaCard key={divida.id} divida={divida} onEdit={handleEdit} onSuccess={handleSuccess} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <DividaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        divida={selectedDivida}
        onSuccess={handleSuccess}
      />
    </>
  )
}
