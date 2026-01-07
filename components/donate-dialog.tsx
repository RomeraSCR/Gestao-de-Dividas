"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Copy, Check, Heart, Coffee } from "lucide-react"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const PIX_KEY = "romeraguilherme@icloud.com"

// Gerar QR Code com a chave PIX (o usuário pode escanear e colar no app do banco)
const PIX_QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
  PIX_KEY
)}`

export function DonateDialog() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY)
      setCopied(true)
      toast.success("Chave PIX copiada!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Erro ao copiar chave PIX")
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1 sm:p-2 h-auto"
      >
        <Heart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">Apoiar</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-blue-500" />
              Apoiar o Projeto
            </DialogTitle>
            <DialogDescription>
              Este projeto é gratuito e de código aberto. Se você gostou e quer ajudar no desenvolvimento, qualquer contribuição é bem-vinda! 💙
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Escaneie o QR Code ou copie a chave PIX:
              </p>
              
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                  <img
                    src={PIX_QR_CODE_URL}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Chave PIX */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Chave PIX (E-mail):</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg border font-mono text-sm break-all">
                    {PIX_KEY}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                💡 A doação é totalmente opcional. Obrigado pelo apoio!
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
