"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch {
        // Sem barulho: PWA é um extra, não deve quebrar o app.
      }
    }

    register()
  }, [])

  return null
}


