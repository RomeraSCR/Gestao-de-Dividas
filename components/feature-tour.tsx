"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { createPortal } from "react-dom"

interface TourStep {
  target: string // CSS selector do elemento
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right"
}

const allTourSteps: TourStep[] = [
  {
    target: "[data-tour='add-divida']",
    title: "Adicionar Dívida",
    description: "Clique aqui para adicionar uma nova compra parcelada. O formulário agora está dividido em 2 etapas!",
    position: "bottom",
  },
  {
    target: "[data-tour='stats-mensal']",
    title: "Resumo Mensal",
    description: "Veja o total a pagar em cada mês. Clique em qualquer mês para ver as parcelas detalhadas!",
    position: "top",
  },
  {
    target: "[data-tour='divida-card']",
    title: "Cards de Dívida",
    description: "Clique em qualquer card para abrir o histórico completo. Você também pode anexar comprovantes!",
    position: "top",
  },
]

interface FeatureTourProps {
  active: boolean
  onComplete: () => void
}

export function FeatureTour({ active, onComplete }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)

  // Filtrar apenas os passos que têm elementos visíveis na página
  const tourSteps = useMemo(() => {
    if (!mounted) return allTourSteps
    return allTourSteps.filter((step) => {
      const element = document.querySelector(step.target)
      return element !== null
    })
  }, [mounted, active])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset step quando tour é ativado
  useEffect(() => {
    if (active) {
      setCurrentStep(0)
    }
  }, [active])

  const updateTargetRect = useCallback(() => {
    if (!active || tourSteps.length === 0) return

    const step = tourSteps[currentStep]
    if (!step) return

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)
      
      // Scroll rápido para o elemento
      element.scrollIntoView({ behavior: "auto", block: "center" })
    } else {
      setTargetRect(null)
    }
  }, [active, currentStep, tourSteps])

  useEffect(() => {
    if (active) {
      // Delay mínimo para permitir renderização
      const timer = setTimeout(updateTargetRect, 50)
      return () => clearTimeout(timer)
    }
  }, [active, currentStep, updateTargetRect])

  useEffect(() => {
    if (active) {
      window.addEventListener("resize", updateTargetRect)
      window.addEventListener("scroll", updateTargetRect)
      return () => {
        window.removeEventListener("resize", updateTargetRect)
        window.removeEventListener("scroll", updateTargetRect)
      }
    }
  }, [active, updateTargetRect])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setCurrentStep(0)
    onComplete()
  }

  if (!mounted || !active || tourSteps.length === 0) return null

  const step = tourSteps[currentStep]
  const isLastStep = currentStep === tourSteps.length - 1
  const isFirstStep = currentStep === 0

  // Calcular posição do tooltip
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }

    const padding = 16
    const tooltipWidth = 300
    const tooltipHeight = 170

    let top = 0
    let left = 0

    switch (step?.position || "bottom") {
      case "top":
        top = targetRect.top - tooltipHeight - padding
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        break
      case "bottom":
        top = targetRect.bottom + padding
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        break
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.left - tooltipWidth - padding
        break
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.right + padding
        break
    }

    // Garantir que não saia da tela
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding))

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    }
  }

  const content = (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay escuro com buraco */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Borda destacada no elemento */}
      {targetRect && (
        <div
          className="absolute border-2 border-blue-400 rounded-xl pointer-events-none"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: "0 0 0 3px rgba(96, 165, 250, 0.4), 0 0 12px rgba(96, 165, 250, 0.4)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-pink-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium opacity-80">
              {currentStep + 1} de {tourSteps.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
              onClick={handleComplete}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="font-bold mt-0.5">{step?.title}</h3>
        </div>

        {/* Conteúdo */}
        <div className="px-4 py-3">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {step?.description}
          </p>
        </div>

        {/* Navegação */}
        <div className="px-4 pb-3 flex gap-2">
          {!isFirstStep && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="flex-1 h-9"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleNext}
            className="flex-1 h-9 bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:from-blue-600 hover:to-pink-600"
          >
            {isLastStep ? "Concluir" : "Próximo"}
            {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        {/* Indicadores de progresso */}
        <div className="px-4 pb-3 flex justify-center gap-1">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentStep
                  ? "w-5 bg-gradient-to-r from-blue-500 to-pink-500"
                  : index < currentStep
                  ? "w-1.5 bg-blue-400"
                  : "w-1.5 bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
