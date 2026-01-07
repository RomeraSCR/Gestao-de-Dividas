import { NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { addMonths } from "date-fns"
import { randomUUID } from "crypto"
import path from "path"
import fs from "fs/promises"

type PagamentoRow = {
  numero_parcela: number
  data_pagamento: string
  valor_pago: number
  comprovante_url: string | null
  comprovante_nome: string | null
}

type ParcelaValorRow = {
  numero_parcela: number
  valor: number
}

function parseMysqlDate(dateString: string) {
  // Espera YYYY-MM-DD
  const [y, m, d] = dateString.split("-").map((n) => Number.parseInt(n, 10))
  return new Date(y, (m || 1) - 1, d || 1)
}

async function saveComprovanteToPublic(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const originalName = (file.name || "comprovante").split(/[\\/]/).pop() || "comprovante"
  const ext = path.extname(originalName) || ".pdf"
  const fileName = `${randomUUID()}${ext}`
  const destDir = path.join(process.cwd(), "public", "comprovantes")

  await fs.mkdir(destDir, { recursive: true })
  const destPath = path.join(destDir, fileName)
  await fs.writeFile(destPath, buffer)

  return {
    url: `/comprovantes/${fileName}`,
    nome: originalName,
    mime: file.type || "application/octet-stream",
  }
}

function formatYYYYMMDD(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dividaId = searchParams.get("divida_id")
    if (!dividaId) {
      return NextResponse.json({ error: "divida_id é obrigatório" }, { status: 400 })
    }

    const divida = await queryOne<{
      user_id: string
      data_fatura: string
      total_parcelas: number
      parcelas_pagas: number
      valor_parcela: number
      valor_variavel: number
    }>(
      "SELECT user_id, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, COALESCE(valor_variavel, 0) as valor_variavel FROM dividas WHERE id = ?",
      [dividaId]
    )

    if (!divida || divida.user_id !== user.id) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 })
    }

    const pagamentos = await query<PagamentoRow>(
      "SELECT numero_parcela, data_pagamento, valor_pago, comprovante_url, comprovante_nome FROM parcelas_pagamentos WHERE divida_id = ? ORDER BY numero_parcela",
      [dividaId]
    )
    const pagamentoByNumero = new Map<number, PagamentoRow>()
    for (const p of pagamentos) pagamentoByNumero.set(Number(p.numero_parcela), p)

    let valoresByNumero = new Map<number, number>()
    const isVariavel = Boolean(divida.valor_variavel)
    if (isVariavel) {
      const valores = await query<ParcelaValorRow>(
        "SELECT numero_parcela, valor FROM parcelas_valores WHERE divida_id = ? ORDER BY numero_parcela",
        [dividaId]
      )
      valoresByNumero = new Map<number, number>(valores.map((v) => [Number(v.numero_parcela), Number(v.valor)]))
    }

    const faturaDate = parseMysqlDate(divida.data_fatura)
    const total = Number(divida.total_parcelas) || 0
    const parcelasPagas = Number(divida.parcelas_pagas) || 0
    const valorPadrao = Number(divida.valor_parcela) || 0

    const parcelas = Array.from({ length: total }, (_, idx) => {
      const numero = idx + 1
      const dueDate = addMonths(faturaDate, numero - 1)
      const pagamento = pagamentoByNumero.get(numero) || null

      const marcadaComoPaga = numero <= parcelasPagas
      const status: "paga" | "pendente" = pagamento || marcadaComoPaga ? "paga" : "pendente"

      const valorPrevisto = isVariavel ? (valoresByNumero.get(numero) ?? valorPadrao) : valorPadrao
      const valor = pagamento ? Number(pagamento.valor_pago) || valorPrevisto : valorPrevisto

      return {
        numero_parcela: numero,
        status,
        due_date: formatYYYYMMDD(dueDate),
        valor,
        pagamento: pagamento
          ? {
              data_pagamento: pagamento.data_pagamento,
              valor_pago: Number(pagamento.valor_pago) || valor,
              comprovante_url: pagamento.comprovante_url,
              comprovante_nome: pagamento.comprovante_nome,
            }
          : null,
      }
    })

    return NextResponse.json({
      divida_id: dividaId,
      total_parcelas: total,
      parcelas_pagas: parcelasPagas,
      parcelas,
    })
  } catch (error) {
    console.error("Erro ao buscar histórico das parcelas:", error)
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const formData = await request.formData()
    const dividaId = formData.get("divida_id") as string
    const numeroParcela = Number(formData.get("numero_parcela"))
    const comprovante = formData.get("comprovante")

    if (!dividaId || !numeroParcela) {
      return NextResponse.json({ error: "divida_id e numero_parcela são obrigatórios" }, { status: 400 })
    }

    if (!comprovante || typeof comprovante !== "object" || !("arrayBuffer" in comprovante)) {
      return NextResponse.json({ error: "Arquivo de comprovante é obrigatório" }, { status: 400 })
    }

    // Verificar se a dívida pertence ao usuário
    const divida = await queryOne<{ user_id: string; parcelas_pagas: number; valor_parcela: number }>(
      "SELECT user_id, parcelas_pagas, valor_parcela FROM dividas WHERE id = ?",
      [dividaId]
    )

    if (!divida || divida.user_id !== user.id) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 })
    }

    // Verificar se a parcela está paga
    if (numeroParcela > divida.parcelas_pagas) {
      return NextResponse.json({ error: "Só é possível anexar comprovante em parcelas já pagas" }, { status: 400 })
    }

    // Salvar o comprovante
    const saved = await saveComprovanteToPublic(comprovante as File)

    // Verificar se já existe registro de pagamento para esta parcela
    const existingPagamento = await queryOne<{ id: string }>(
      "SELECT id FROM parcelas_pagamentos WHERE divida_id = ? AND numero_parcela = ?",
      [dividaId, numeroParcela]
    )

    const today = new Date().toISOString().split("T")[0]

    if (existingPagamento) {
      // Atualizar o comprovante existente
      await query(
        `UPDATE parcelas_pagamentos 
         SET comprovante_url = ?, comprovante_nome = ?, comprovante_mime = ?
         WHERE divida_id = ? AND numero_parcela = ?`,
        [saved.url, saved.nome, saved.mime, dividaId, numeroParcela]
      )
    } else {
      // Criar registro de pagamento com o comprovante
      const pagamentoId = randomUUID()
      await query(
        `INSERT INTO parcelas_pagamentos 
         (id, divida_id, numero_parcela, data_pagamento, valor_pago, comprovante_url, comprovante_nome, comprovante_mime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [pagamentoId, dividaId, numeroParcela, today, divida.valor_parcela, saved.url, saved.nome, saved.mime]
      )
    }

    return NextResponse.json({ success: true, comprovante_url: saved.url })
  } catch (error) {
    console.error("Erro ao enviar comprovante:", error)
    return NextResponse.json({ error: "Erro ao enviar comprovante" }, { status: 500 })
  }
}
