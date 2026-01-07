"use server"

import { query, queryOne } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { DividaFormData } from "@/lib/types"
import { randomUUID } from "crypto"
import fs from "node:fs/promises"
import path from "node:path"

export async function createDivida(formData: DividaFormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Usuário não autenticado" }
  }

  try {
    const dividaId = randomUUID()
    await query(
      `INSERT INTO dividas (id, user_id, autor, produto, loja, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, valor_variavel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dividaId,
        user.id,
        formData.autor,
        formData.produto,
        formData.loja,
        formData.data_fatura,
        formData.total_parcelas,
        formData.parcelas_pagas || 0,
        formData.valor_parcela,
        formData.valor_variavel || false,
      ]
    )
    
    // Se for valor variável, criar valores padrão para todas as parcelas
    if (formData.valor_variavel) {
      for (let i = 1; i <= formData.total_parcelas; i++) {
        const parcelaValorId = randomUUID()
        await query(
          `INSERT INTO parcelas_valores (id, divida_id, numero_parcela, valor)
           VALUES (?, ?, ?, ?)`,
          [parcelaValorId, dividaId, i, formData.valor_parcela]
        )
      }
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("[Dashboard] Erro ao criar dívida:", error)
    return { error: "Erro ao criar dívida" }
  }
}

export async function updateDivida(id: string, formData: DividaFormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Verificar se a dívida pertence ao usuário
    const divida = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM dividas WHERE id = ?",
      [id]
    )

    if (!divida) {
      return { error: "Dívida não encontrada" }
    }

    if (divida.user_id !== user.id) {
      return { error: "Sem permissão para alterar esta dívida" }
    }

    await query(
      `UPDATE dividas 
       SET autor = ?, produto = ?, loja = ?, data_fatura = ?, total_parcelas = ?, parcelas_pagas = ?, valor_parcela = ?, valor_variavel = ?
       WHERE id = ?`,
      [
        formData.autor,
        formData.produto,
        formData.loja,
        formData.data_fatura,
        formData.total_parcelas,
        formData.parcelas_pagas,
        formData.valor_parcela,
        formData.valor_variavel || false,
        id,
      ]
    )
    
    // Se mudou para valor variável, criar valores padrão para parcelas que não existem
    if (formData.valor_variavel) {
      const existingParcelas = await query<{ numero_parcela: number }>(
        "SELECT numero_parcela FROM parcelas_valores WHERE divida_id = ?",
        [id]
      )
      const existingNumbers = new Set(existingParcelas.map((p) => p.numero_parcela))
      
      for (let i = 1; i <= formData.total_parcelas; i++) {
        if (!existingNumbers.has(i)) {
          const parcelaValorId = randomUUID()
          await query(
            `INSERT INTO parcelas_valores (id, divida_id, numero_parcela, valor)
             VALUES (?, ?, ?, ?)`,
            [parcelaValorId, id, i, formData.valor_parcela]
          )
        }
      }
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("[Dashboard] Erro ao atualizar dívida:", error)
    return { error: "Erro ao atualizar dívida" }
  }
}

export async function deleteDivida(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Verificar se a dívida pertence ao usuário
    const divida = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM dividas WHERE id = ?",
      [id]
    )

    if (!divida) {
      return { error: "Dívida não encontrada" }
    }

    if (divida.user_id !== user.id) {
      return { error: "Sem permissão para deletar esta dívida" }
    }

    await query("DELETE FROM dividas WHERE id = ?", [id])

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("[Dashboard] Erro ao deletar dívida:", error)
    return { error: "Erro ao deletar dívida" }
  }
}

export async function payNextParcela(id: string, valorParcela?: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Usuário não autenticado" }
  }

  try {
    const divida = await queryOne<{
      id: string
      user_id: string
      total_parcelas: number
      parcelas_pagas: number
      valor_variavel: boolean
      valor_parcela: number
    }>(
      "SELECT id, user_id, total_parcelas, parcelas_pagas, valor_variavel, valor_parcela FROM dividas WHERE id = ?",
      [id]
    )

    if (!divida) {
      return { error: "Dívida não encontrada" }
    }

    if (divida.user_id !== user.id) {
      return { error: "Sem permissão para alterar esta dívida" }
    }

    if (divida.parcelas_pagas >= divida.total_parcelas) {
      return { success: true, parcelas_pagas: divida.parcelas_pagas }
    }

    const parcelas_pagas = divida.parcelas_pagas + 1
    const numeroParcela = parcelas_pagas

    // Se for valor variável e foi fornecido um valor, atualizar o valor da parcela
    if (divida.valor_variavel && valorParcela && valorParcela > 0) {
      // Atualizar ou inserir o valor da parcela
      await query(
        `INSERT INTO parcelas_valores (id, divida_id, numero_parcela, valor)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE valor = ?`,
        [randomUUID(), id, numeroParcela, valorParcela, valorParcela]
      )
    }

    await query("UPDATE dividas SET parcelas_pagas = ? WHERE id = ?", [parcelas_pagas, id])

    revalidatePath("/dashboard", "layout")
    return { success: true, parcelas_pagas }
  } catch (error) {
    console.error("[Dashboard] Erro ao pagar parcela:", error)
    return { error: "Erro ao pagar parcela" }
  }
}

function formatLocalDateYYYYMMDD(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

async function saveComprovanteToPublic(file: File) {
  const maxBytes = 10 * 1024 * 1024 // 10MB
  if (file.size > maxBytes) {
    return { error: "Comprovante muito grande (máx. 10MB)" as const }
  }

  const allowed = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ])
  if (file.type && !allowed.has(file.type)) {
    return { error: "Tipo de arquivo não permitido (use PDF ou imagem)" as const }
  }

  const originalName = (file.name || "comprovante").split(/[\\/]/).pop() || "comprovante"
  const ext = path.extname(originalName).toLowerCase()
  const fileName = `${randomUUID()}${ext || ""}`

  const destDir = path.join(process.cwd(), "public", "comprovantes")
  await fs.mkdir(destDir, { recursive: true })

  const destPath = path.join(destDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(destPath, buffer)

  return {
    url: `/comprovantes/${fileName}`,
    nome: originalName,
    mime: file.type || null,
  }
}

export async function payNextParcelaWithComprovante(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Usuário não autenticado" }
  }

  const id = String(formData.get("divida_id") || "").trim()
  if (!id) {
    return { error: "divida_id é obrigatório" }
  }

  const rawValor = formData.get("valor_parcela")
  const valorParcela =
    typeof rawValor === "string" && rawValor.trim() !== "" ? Number(rawValor.replace(",", ".")) : undefined

  const comprovante = formData.get("comprovante")

  try {
    const divida = await queryOne<{
      id: string
      user_id: string
      total_parcelas: number
      parcelas_pagas: number
      valor_variavel: boolean
      valor_parcela: number
    }>(
      "SELECT id, user_id, total_parcelas, parcelas_pagas, valor_variavel, valor_parcela FROM dividas WHERE id = ?",
      [id]
    )

    if (!divida) {
      return { error: "Dívida não encontrada" }
    }

    if (divida.user_id !== user.id) {
      return { error: "Sem permissão para alterar esta dívida" }
    }

    if (divida.parcelas_pagas >= divida.total_parcelas) {
      return { success: true, parcelas_pagas: divida.parcelas_pagas }
    }

    const parcelas_pagas = divida.parcelas_pagas + 1
    const numeroParcela = parcelas_pagas

    // Se for valor variável e foi fornecido um valor, atualizar o valor da parcela
    if (divida.valor_variavel && valorParcela && valorParcela > 0) {
      await query(
        `INSERT INTO parcelas_valores (id, divida_id, numero_parcela, valor)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE valor = ?`,
        [randomUUID(), id, numeroParcela, valorParcela, valorParcela]
      )
    }

    // Determinar o valor pago a registrar
    let valorPago = Number(divida.valor_parcela) || 0
    if (divida.valor_variavel) {
      if (valorParcela && valorParcela > 0) {
        valorPago = valorParcela
      } else {
        const row = await queryOne<{ valor: number }>(
          "SELECT valor FROM parcelas_valores WHERE divida_id = ? AND numero_parcela = ?",
          [id, numeroParcela]
        )
        if (row?.valor) {
          valorPago = Number(row.valor) || valorPago
        }
      }
    }

    // Salvar comprovante (se enviado)
    let comprovanteUrl: string | null = null
    let comprovanteNome: string | null = null
    let comprovanteMime: string | null = null
    if (comprovante && typeof comprovante === "object" && "arrayBuffer" in comprovante) {
      const saved = await saveComprovanteToPublic(comprovante as File)
      if ("error" in saved) {
        return { error: saved.error }
      }
      comprovanteUrl = saved.url
      comprovanteNome = saved.nome
      comprovanteMime = saved.mime
    }

    // Atualizar status da dívida e registrar pagamento
    await query("UPDATE dividas SET parcelas_pagas = ? WHERE id = ?", [parcelas_pagas, id])

    const dataPagamento = formatLocalDateYYYYMMDD(new Date())
    await query(
      `INSERT INTO parcelas_pagamentos (
        id, divida_id, numero_parcela, data_pagamento, valor_pago,
        comprovante_url, comprovante_nome, comprovante_mime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        data_pagamento = VALUES(data_pagamento),
        valor_pago = VALUES(valor_pago),
        comprovante_url = VALUES(comprovante_url),
        comprovante_nome = VALUES(comprovante_nome),
        comprovante_mime = VALUES(comprovante_mime)`,
      [
        randomUUID(),
        id,
        numeroParcela,
        dataPagamento,
        valorPago,
        comprovanteUrl,
        comprovanteNome,
        comprovanteMime,
      ]
    )

    revalidatePath("/dashboard", "layout")
    return { success: true, parcelas_pagas }
  } catch (error) {
    console.error("[Dashboard] Erro ao pagar parcela (com comprovante):", error)
    return { error: "Erro ao pagar parcela" }
  }
}
