import { NextResponse } from "next/server"
import path from "node:path"
import fs from "node:fs/promises"
import { getCurrentUser } from "@/lib/auth"
import { queryOne } from "@/lib/db"

function guessMimeFromFilename(file: string): string {
  const ext = path.extname(file).toLowerCase()
  switch (ext) {
    case ".pdf":
      return "application/pdf"
    case ".png":
      return "image/png"
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".webp":
      return "image/webp"
    default:
      return "application/octet-stream"
  }
}

function safeFileName(input: string) {
  // Next já entrega um único segmento, mas vamos ser explícitos contra path traversal.
  if (!input) return null
  let decoded = input
  try {
    decoded = decodeURIComponent(input)
  } catch {
    return null
  }
  const base = path.basename(decoded)
  if (!base) return null
  // Rejeita qualquer tentativa de path traversal / segmentos
  if (base !== decoded) return null
  if (base.includes("..")) return null
  // Permitir apenas caracteres comuns de nome de arquivo
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) return null
  return base
}

type ComprovanteMeta = {
  user_id: string
  comprovante_mime: string | null
  comprovante_nome: string | null
}

export async function GET(request: Request, ctx: { params: Promise<{ file: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { file } = await ctx.params
  const safe = safeFileName(file)
  if (!safe) {
    return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 })
  }

  // Validar que o comprovante pertence ao usuário logado.
  // Como o schema atual guarda apenas a URL, fazemos o match pelo sufixo do nome do arquivo.
  const meta = await queryOne<ComprovanteMeta>(
    `SELECT d.user_id, pp.comprovante_mime, pp.comprovante_nome
     FROM parcelas_pagamentos pp
     JOIN dividas d ON d.id = pp.divida_id
     WHERE pp.comprovante_url LIKE ? OR pp.comprovante_url LIKE ?
     LIMIT 1`,
    [`%/comprovantes/${safe}`, `%${safe}`]
  )

  if (!meta) {
    return NextResponse.json({ error: "Comprovante não encontrado" }, { status: 404 })
  }
  if (meta.user_id !== user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const mime = meta.comprovante_mime || guessMimeFromFilename(safe)
  const downloadName = (meta.comprovante_nome || safe).replaceAll('"', "")

  // 1) Tenta servir do disco local (dev / servidor próprio).
  try {
    const localPath = path.join(process.cwd(), "public", "comprovantes", safe)
    const buffer = await fs.readFile(localPath)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mime,
        // Conteúdo sensível: não cachear em navegador/CDN.
        "Cache-Control": "no-store, max-age=0",
        "Content-Disposition": `inline; filename="${downloadName}"`,
      },
    })
  } catch {
    // continua para o fallback remoto
  }

  // 2) Fallback: se o banco é compartilhado e o arquivo está em outro host,
  // tenta buscar do site configurado (ex.: produção) e repassa o conteúdo.
  // Mantém o mesmo fallback usado em `app/layout.tsx`, para funcionar mesmo sem .env local.
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dividas.neonproject.cloud"

  let remoteUrl: URL
  try {
    remoteUrl = new URL(`/comprovantes/${safe}`, base)
  } catch {
    return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL inválida" }, { status: 500 })
  }

  // Evitar loop caso a base aponte pro mesmo host (ex.: localhost)
  try {
    const reqUrl = new URL(request.url)
    if (reqUrl.host && reqUrl.host === remoteUrl.host) {
      return NextResponse.json({ error: "Comprovante não encontrado" }, { status: 404 })
    }
  } catch {
    // ignore
  }

  const remoteRes = await fetch(remoteUrl.toString(), { cache: "no-store" })
  if (!remoteRes.ok || !remoteRes.body) {
    return NextResponse.json({ error: "Comprovante não encontrado" }, { status: 404 })
  }

  return new NextResponse(remoteRes.body, {
    status: 200,
    headers: {
      "Content-Type": remoteRes.headers.get("content-type") || mime,
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": `inline; filename="${downloadName}"`,
    },
  })
}


