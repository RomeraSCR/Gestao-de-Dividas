import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

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

    // Verificar se a dívida pertence ao usuário
    const divida = await query<{ user_id: string }>(
      "SELECT user_id FROM dividas WHERE id = ?",
      [dividaId]
    )

    if (!divida || divida.length === 0 || divida[0].user_id !== user.id) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 })
    }

    // Buscar valores das parcelas
    const valores = await query<{ numero_parcela: number; valor: number }>(
      "SELECT numero_parcela, valor FROM parcelas_valores WHERE divida_id = ? ORDER BY numero_parcela",
      [dividaId]
    )

    return NextResponse.json(valores)
  } catch (error) {
    console.error("Erro ao buscar valores das parcelas:", error)
    return NextResponse.json({ error: "Erro ao buscar valores" }, { status: 500 })
  }
}
