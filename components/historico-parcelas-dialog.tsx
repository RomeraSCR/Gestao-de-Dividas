"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, FileText, Loader2, Upload, CheckCircle2, Clock, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ComprovanteViewerDialog } from "@/components/comprovante-viewer-dialog"

type ParcelaHistorico = {
  numero_parcela: number
  status: "paga" | "pendente"
  due_date: string
  valor: number
  pagamento: null | {
    data_pagamento: string
    valor_pago: number
    comprovante_url: string | null
    comprovante_nome: string | null
  }
}

type HistoricoResponse = {
  divida_id: string
  total_parcelas: number
  parcelas_pagas: number
  parcelas: ParcelaHistorico[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
}

function formatDateBR(yyyyMMdd: string) {
  if (!yyyyMMdd) return "--/--/----"
  const [y, m, d] = yyyyMMdd.split("-")
  if (!y || !m || !d) return yyyyMMdd
  return `${d}/${m}/${y}`
}

export function HistoricoParcelasDialog({
  open,
  onOpenChange,
  dividaId,
  titulo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dividaId: string
  titulo: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<HistoricoResponse | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerFile, setViewerFile] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadParcela, setUploadParcela] = useState<number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/parcelas-historico?divida_id=${encodeURIComponent(dividaId)}`)
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json?.error || "Erro ao carregar histórico")
        }
        if (!cancelled) setData(json as HistoricoResponse)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Erro ao carregar histórico")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, dividaId])

  const { pagas, pendentes } = useMemo(() => {
    const parcelas = data?.parcelas || []
    return {
      pagas: parcelas.filter((p) => p.status === "paga"),
      pendentes: parcelas.filter((p) => p.status === "pendente"),
    }
  }, [data])

  const openViewer = (comprovanteUrl: string) => {
    try {
      const u = new URL(comprovanteUrl, window.location.origin)
      const file = u.pathname.split("/").filter(Boolean).pop()
      if (!file) throw new Error("URL inválida")
      setViewerFile(file)
      setViewerOpen(true)
    } catch {
      const file = comprovanteUrl.split("?")[0].split("/").filter(Boolean).pop() || null
      setViewerFile(file)
      setViewerOpen(true)
    }
  }

  const handleOpenUpload = (numeroParcela: number) => {
    setUploadParcela(numeroParcela)
    setUploadFile(null)
    setUploadDialogOpen(true)
  }

  const handleUploadComprovante = async () => {
    if (!uploadFile || !uploadParcela || !dividaId) return
    
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.set("divida_id", dividaId)
      fd.set("numero_parcela", String(uploadParcela))
      fd.set("comprovante", uploadFile)

      const res = await fetch("/api/parcelas-historico", {
        method: "POST",
        body: fd,
      })
      
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || "Erro ao enviar comprovante")
      }

      const reloadRes = await fetch(`/api/parcelas-historico?divida_id=${encodeURIComponent(dividaId)}`)
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json()
        setData(reloadData as HistoricoResponse)
      }

      setUploadDialogOpen(false)
      setUploadFile(null)
      setUploadParcela(null)
    } catch (e: any) {
      alert(e?.message || "Erro ao enviar comprovante")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[85vh] overflow-hidden flex flex-col sm:max-w-[560px] p-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        {/* Header fixo */}
        <div className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">
                Histórico de Parcelas
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm truncate">
                {titulo}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full hover:bg-white/50 dark:hover:bg-slate-700"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          {data && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800 border text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">{data.total_parcelas}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-700 dark:text-green-300">{pagas.length} pagas</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-sm">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-700 dark:text-amber-300">{pendentes.length} pendentes</span>
              </div>
            </div>
          )}
        </div>

        {/* Lista de parcelas com scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando histórico…
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : !data ? (
            <div className="text-sm text-muted-foreground text-center py-12">Sem dados.</div>
          ) : (
            <div className="space-y-2">
              {data.parcelas.map((p) => {
                const hasComprovante = Boolean(p.pagamento?.comprovante_url)
                const comprovanteNome = p.pagamento?.comprovante_nome || "Comprovante"
                const isPaga = p.status === "paga"
                
                return (
                  <div 
                    key={p.numero_parcela} 
                    className={`
                      rounded-xl border p-4 transition-all
                      ${isPaga 
                        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
                        : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Info da parcela */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-bold
                          ${isPaga 
                            ? "bg-green-500 text-white" 
                            : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                          }
                        `}>
                          {p.numero_parcela}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base">{formatCurrency(p.valor)}</span>
                            {isPaga && (
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Venc.: {formatDateBR(p.due_date)}
                            {p.pagamento?.data_pagamento && (
                              <span className="text-green-600 dark:text-green-400"> • Pago em {formatDateBR(p.pagamento.data_pagamento)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isPaga ? (
                          <>
                            {hasComprovante && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openViewer(p.pagamento!.comprovante_url!)
                                  }}
                                  title={comprovanteNome}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button 
                                  asChild 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 px-2"
                                >
                                  <a 
                                    href={p.pagamento!.comprovante_url!} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    title="Abrir em nova aba"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant={hasComprovante ? "ghost" : "outline"}
                              className="h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenUpload(p.numero_parcela)
                              }}
                              title={hasComprovante ? "Trocar comprovante" : "Adicionar comprovante"}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Pendente</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleClose}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>

      <ComprovanteViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        file={viewerFile}
        title="Comprovante"
      />

      {/* Dialog de upload de comprovante */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent 
          className="sm:max-w-[400px]" 
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>
              {uploadParcela ? `Comprovante da Parcela #${uploadParcela}` : "Anexar Comprovante"}
            </DialogTitle>
            <DialogDescription>
              Selecione o arquivo do comprovante (PDF ou imagem, máx. 10MB)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comprovante-upload">Arquivo</Label>
              <Input
                id="comprovante-upload"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setUploadFile(file)
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleUploadComprovante}
              disabled={isUploading || !uploadFile}
              className="bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:from-blue-600 hover:to-pink-600"
            >
              {isUploading ? "Enviando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
