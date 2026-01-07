"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

type Payload =
  | { mime: string; nome: string; base64: string }
  | { error: string }

function isPdf(mime: string, nome?: string) {
  const m = (mime || "").toLowerCase()
  if (m.includes("pdf")) return true
  return (nome || "").toLowerCase().endsWith(".pdf")
}

function isImage(mime: string) {
  return (mime || "").toLowerCase().startsWith("image/")
}

export function ComprovanteViewerDialog({
  open,
  onOpenChange,
  file,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: string | null
  title?: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{ mime: string; nome: string; base64: string } | null>(null)

  useEffect(() => {
    if (!open || !file) return
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      setData(null)
      try {
        const res = await fetch(`/api/comprovantes/${encodeURIComponent(file)}`, { cache: "no-store" })
        const json = (await res.json()) as Payload
        if (!res.ok) {
          throw new Error(("error" in json && json.error) || "Erro ao carregar comprovante")
        }
        if (!cancelled) setData(json as any)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Erro ao carregar comprovante")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, file])

  const dataUrl = useMemo(() => {
    if (!data) return null
    return `data:${data.mime};base64,${data.base64}`
  }, [data])

  const kind = useMemo(() => {
    if (!data) return null
    if (isPdf(data.mime, data.nome)) return "pdf" as const
    if (isImage(data.mime)) return "image" as const
    return "other" as const
  }, [data])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[980px] p-0 sm:w-[92vw] md:w-[88vw] lg:w-[900px]">
        <div className="flex h-[92vh] flex-col sm:h-[90vh]">
          {/* O X de fechar já vem do DialogContent (Radix). Reservamos espaço à direita pra não sobrepor. */}
          <DialogHeader className="border-b px-4 py-2 pr-14 sm:px-5 sm:py-3 sm:pr-16">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg">{title || "Comprovante"}</DialogTitle>
                <DialogDescription className="mt-0.5 min-w-0 truncate text-xs sm:text-sm">
                  {data?.nome || file || ""}
                </DialogDescription>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {dataUrl && data ? (
                  <Button asChild size="sm" variant="outline" className="bg-transparent">
                    <a href={dataUrl} download={data.nome || "comprovante"} title="Baixar comprovante">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="bg-transparent" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 p-3 sm:p-4">
            {isLoading ? (
              <div className="flex h-full min-h-[50vh] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
                Carregando…
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : !dataUrl || !data ? (
              <div className="flex h-full min-h-[45vh] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
                Sem dados.
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col rounded-lg border bg-black/90 p-2 sm:p-3">
                {kind === "pdf" ? (
                  <iframe
                    title={data.nome || "PDF"}
                    src={dataUrl}
                    className="h-full w-full rounded-md bg-background"
                  />
                ) : kind === "image" ? (
                  <div className="flex h-full items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dataUrl}
                      alt={data.nome || "Comprovante"}
                      className="max-h-full w-auto rounded-md bg-background object-contain"
                    />
                  </div>
                ) : (
                  <div className="rounded-md bg-background p-4 text-sm text-muted-foreground">
                    Tipo de arquivo não suportado para visualização ({data.mime}). Use o download.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


