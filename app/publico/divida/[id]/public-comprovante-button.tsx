"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Download, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function isPdf(mime: string, nome?: string) {
  const m = (mime || "").toLowerCase()
  if (m.includes("pdf")) return true
  return (nome || "").toLowerCase().endsWith(".pdf")
}

function isImage(mime: string) {
  return (mime || "").toLowerCase().startsWith("image/")
}

export function PublicComprovanteButton({
  dividaId,
  comprovanteUrl,
  comprovanteNome,
}: {
  dividaId: string
  comprovanteUrl: string
  comprovanteNome: string
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{ mime: string; nome: string; base64: string } | null>(null)

  const handleOpen = async () => {
    setOpen(true)
    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      const fileName = comprovanteUrl.split("/").pop()
      const res = await fetch(`/api/comprovantes/${encodeURIComponent(fileName || "")}?divida_id=${encodeURIComponent(dividaId)}`)
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar comprovante")
      }
      setData(json)
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar comprovante")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!data) return
    const link = document.createElement("a")
    link.href = `data:${data.mime};base64,${data.base64}`
    link.download = data.nome
    link.click()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-indigo-500 hover:text-indigo-700"
        onClick={handleOpen}
        title="Ver Comprovante"
      >
        <FileText className="h-4.5 w-4.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800 dark:text-gray-100">
                Visualizar Comprovante
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {comprovanteNome}
              </DialogDescription>
            </div>
            {data && (
              <Button size="sm" variant="outline" className="flex items-center gap-1 cursor-pointer" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 min-h-[300px] flex items-center justify-center overflow-auto mt-4">
            {isLoading && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Carregando arquivo...</span>
              </div>
            )}

            {error && (
              <div className="text-center p-4">
                <p className="text-sm font-semibold text-destructive">{error}</p>
              </div>
            )}

            {data && (
              <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                {isImage(data.mime) ? (
                  <img
                    src={`data:${data.mime};base64,${data.base64}`}
                    alt={data.nome}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                  />
                ) : isPdf(data.mime, data.nome) ? (
                  <iframe
                    src={`data:${data.mime};base64,${data.base64}`}
                    className="w-full h-[60vh] rounded-lg border border-border"
                    title={data.nome}
                  />
                ) : (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-border w-full">
                    <p className="text-sm text-muted-foreground mb-4">
                      Este tipo de arquivo ({data.mime}) não pode ser pré-visualizado no navegador.
                    </p>
                    <Button onClick={handleDownload} className="flex items-center gap-1.5 mx-auto">
                      <Download className="h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
