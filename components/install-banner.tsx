"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Share2, PlusSquare, Download, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isIos() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
}

function isSafariIos() {
  if (!isIos()) return false
  const ua = navigator.userAgent || ""
  const isOther = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(ua)
  const hasSafari = /Safari/.test(ua)
  return hasSafari && !isOther
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (navigator as any).standalone
}

const DISMISS_KEY = "install_banner_dismissed_at"
const DISMISS_DAYS = 7

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [showManualHint, setShowManualHint] = useState(false)

  const canShow = useMemo(() => {
    if (isStandalone()) return false
    // iOS não tem beforeinstallprompt; usamos instrução.
    // Desktop/Android: mostramos o banner e, quando disponível, habilitamos instalação 1-clique.
    return true
  }, [deferred])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      // Se o prompt ficar disponível, mostre o banner mesmo que o usuário tenha fechado antes.
      setDismissed(false)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  useEffect(() => {
    if (!canShow) return
    try {
      const raw = localStorage.getItem(DISMISS_KEY)
      if (!raw) {
        setDismissed(false)
        return
      }
      const ts = Number(raw)
      if (!Number.isFinite(ts)) {
        setDismissed(false)
        return
      }
      const maxAge = DISMISS_DAYS * 24 * 60 * 60 * 1000
      setDismissed(Date.now() - ts < maxAge)
    } catch {
      setDismissed(false)
    }
  }, [canShow])

  if (!canShow || dismissed) return null

  const onClose = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // ignore
    }
  }

  const onInstall = async () => {
    // iOS não tem prompt 1-clique; só instrução.
    if (isIos()) return

    if (!deferred) {
      // Alguns navegadores (ou estados) não disparam beforeinstallprompt.
      // Mostramos o caminho manual (menu do navegador).
      setShowManualHint(true)
      return
    }

    await deferred.prompt()
    try {
      await deferred.userChoice
    } finally {
      setDeferred(null)
      onClose()
    }
  }

  const safari = isSafariIos()
  const isIOS = isIos()

  return (
    <div className="w-full border-b border-white/25 dark:border-blue-500/20 bg-white/45 dark:bg-slate-900/30 backdrop-blur-xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.25)]">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-xs sm:text-sm text-slate-800 dark:text-gray-200">
            {isIOS ? (
              safari ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">Instale como app:</span>
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-gray-300">
                    <Share2 className="h-3.5 w-3.5" />
                    Compartilhar
                  </span>
                  <span className="text-slate-500 dark:text-gray-400">→</span>
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-gray-300">
                    <PlusSquare className="h-3.5 w-3.5" />
                    Adicionar à Tela de Início
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">Para instalar no iPhone:</span>
                  <span className="text-slate-700 dark:text-gray-300">abra este site no</span>
                  <span className="font-semibold">Chrome</span>
                  <span className="text-slate-500 dark:text-gray-400">e use</span>
                  <span className="inline-flex items-center gap-1">
                    <Share2 className="h-3.5 w-3.5" />
                    Compartilhar
                  </span>
                  <span className="text-slate-500 dark:text-gray-400">→</span>
                  <span className="inline-flex items-center gap-1">
                    <PlusSquare className="h-3.5 w-3.5" />
                    Adicionar à Tela de Início
                  </span>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">Instale o app:</span>
                  <span className="text-slate-700 dark:text-gray-300">funciona no celular e no desktop.</span>
                </div>
                {showManualHint && (
                  <div className="text-[11px] sm:text-xs text-slate-600 dark:text-gray-300/90">
                    Se o botão de instalar não abrir o prompt, use o menu do navegador (⋮) e toque em{" "}
                    <span className="font-semibold">“Instalar app”</span> / <span className="font-semibold">“Adicionar à tela inicial”</span>.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isIOS && (
              <Button
                size="sm"
                variant="outline"
                onClick={onInstall}
                className="h-8 bg-white/40 dark:bg-slate-900/30 backdrop-blur border-white/30 dark:border-blue-500/25"
              >
                <MonitorSmartphone className="mr-2 h-4 w-4" />
                Baixar app
                <Download className="ml-2 h-4 w-4 opacity-80" />
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-1 text-slate-600 hover:text-slate-900 dark:text-gray-300 dark:hover:text-white"
              aria-label="Fechar"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


