"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, X, Zap, Calendar, FileUp, ListChecks } from "lucide-react"

// Versão atual da atualização - incremente quando adicionar novas features
const CURRENT_UPDATE_VERSION = "1.0.0"
const STORAGE_KEY = "divi-last-seen-update"
const STORAGE_KEY_DONT_SHOW = "divi-dont-show-updates"

interface UpdateNotificationProps {
  onStartTour: () => void
}

// Lista de novidades desta versão
const updates = [
  {
    icon: Zap,
    title: "Histórico Melhorado",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Calendar,
    title: "Detalhes por Mês",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: FileUp,
    title: "Anexar Comprovantes",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: ListChecks,
    title: "Formulário em Etapas",
    color: "from-green-500 to-emerald-500",
  },
]

export function UpdateNotification({ onStartTour }: UpdateNotificationProps) {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY)
    const dontShow = localStorage.getItem(STORAGE_KEY_DONT_SHOW)

    if (dontShow === "true") {
      return
    }

    if (lastSeenVersion !== CURRENT_UPDATE_VERSION) {
      const timer = setTimeout(() => {
        setOpen(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_UPDATE_VERSION)
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY_DONT_SHOW, "true")
    }
    setOpen(false)
  }

  const handleStartTour = () => {
    handleClose()
    onStartTour()
  }

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="sm:max-w-[380px] p-0 overflow-hidden border-0 bg-transparent shadow-none"
        showCloseButton={false}
      >
        {/* Título oculto para acessibilidade */}
        <DialogTitle className="sr-only">
          Novidades da versão {CURRENT_UPDATE_VERSION}
        </DialogTitle>

        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Gradiente de fundo animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
          
          {/* Botão fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header compacto */}
          <div className="relative z-10 pt-6 pb-4 px-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 mb-3 shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Novidades v{CURRENT_UPDATE_VERSION}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Confira o que há de novo!
            </p>
          </div>

          {/* Grid de novidades */}
          <div className="relative z-10 px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {updates.map((update, index) => (
                <div
                  key={index}
                  className="group relative p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default"
                >
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${update.color} mb-2`}>
                    <update.icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">
                    {update.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 px-4 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                className="h-4 w-4"
              />
              <Label 
                htmlFor="dont-show" 
                className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                Não mostrar novamente
              </Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-1 h-10"
                onClick={handleClose}
              >
                Fechar
              </Button>
              <Button 
                size="sm"
                className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:from-blue-600 hover:to-pink-600 shadow-md"
                onClick={handleStartTour}
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Ver Tour
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Função para resetar o estado (útil para testes)
export function resetUpdateNotification() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY_DONT_SHOW)
}
