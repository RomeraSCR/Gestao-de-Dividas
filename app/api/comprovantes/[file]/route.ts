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
  if (!input) return null
  let decoded = input
  try {
    decoded = decodeURIComponent(input)
  } catch {
    return null
  }
  const base = path.basename(decoded)
  if (!base) return null
  if (base !== decoded) return null
  if (base.includes("..")) return null
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
  const nome = meta.comprovante_nome || safe

  // 1) Local
  try {
    const localPath = path.join(process.cwd(), "public", "comprovantes", safe)
    const buffer = await fs.readFile(localPath)
    return NextResponse.json({
      mime,
      nome,
      base64: buffer.toString("base64"),
    })
  } catch {
    // fallback remoto
  }

  // 2) Remoto (se o banco é compartilhado)
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://dividas.neonproject.cloud"
  let remoteUrl: URL
  try {
    remoteUrl = new URL(`/comprovantes/${safe}`, base)
  } catch {
    return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL inválida" }, { status: 500 })
  }

  // Evitar loop
  try {
    const reqUrl = new URL(request.url)
    if (reqUrl.host && reqUrl.host === remoteUrl.host) {
      return NextResponse.json({ error: "Comprovante não encontrado" }, { status: 404 })
    }
  } catch {
    // ignore
  }

  const remoteRes = await fetch(remoteUrl.toString(), { cache: "no-store" })
  if (!remoteRes.ok) {
    return NextResponse.json({ error: "Comprovante não encontrado" }, { status: 404 })
  }
  const ab = await remoteRes.arrayBuffer()
  const buffer = Buffer.from(ab)

  return NextResponse.json({
    mime: remoteRes.headers.get("content-type") || mime,
    nome,
    base64: buffer.toString("base64"),
  })
}


