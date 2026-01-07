"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (navigator as any).standalone
}

export function InstallAppButton({
  variant = "outline",
  size = "lg",
  className,
  label = "Baixar no celular",
}: {
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
  label?: string
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  const canInstall = useMemo(() => {
    if (isStandalone()) return false
    return Boolean(deferred)
  }, [deferred])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const onClick = async () => {
    if (isStandalone()) return
    if (!deferred) return
    await deferred.prompt()
    try {
      await deferred.userChoice
    } finally {
      setDeferred(null)
    }
  }

  if (!canInstall) return null

  return (
    <Button variant={variant} size={size} className={className} onClick={onClick}>
      <Smartphone className="mr-2 h-4 w-4" />
      {label}
      <Download className="ml-2 h-4 w-4 opacity-80" />
    </Button>
  )
}


