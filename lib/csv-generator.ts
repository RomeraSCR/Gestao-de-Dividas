import type { Receita, Gasto, Divida } from "./types"

// Auxiliar para escapar valores em CSV e usar ponto e vírgula
function escapeCSVValue(val: any): string {
  if (val === null || val === undefined) return ""
  let str = String(val)
  // Substituir aspas por aspas duplas
  str = str.replace(/"/g, '""')
  // Se contiver ponto e vírgula, aspas ou quebras de linha, envolve com aspas
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str}"`
  }
  return str
}

// Formatar data para exibição no CSV (YYYY-MM-DD para DD/MM/YYYY)
function formatDateBR(dateStr: any): string {
  if (!dateStr) return ""
  try {
    const parts = String(dateStr).split("T")[0].split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  } catch (e) {}
  return String(dateStr)
}

// Helper para iniciar download do CSV no navegador
function downloadCSV(csvContent: string, filename: string) {
  // UTF-8 BOM (\uFEFF) para garantir acentuação correta no Excel em português
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportReceitasCSV(receitas: Receita[]) {
  const headers = ["Descrição", "Valor (R$)", "Data Receita", "Data de Criação"]
  const rows = receitas.map(r => [
    r.descricao,
    r.valor,
    formatDateBR(r.data_receita),
    formatDateBR(r.created_at)
  ])

  const csvContent = [
    headers.join(";"),
    ...rows.map(row => row.map(escapeCSVValue).join(";"))
  ].join("\r\n")

  downloadCSV(csvContent, `receitas_${new Date().toISOString().split("T")[0]}.csv`)
}

export function exportGastosCSV(gastos: Gasto[]) {
  const headers = ["Descrição", "Categoria", "Tipo", "Valor (R$)", "Data do Gasto", "Data de Criação"]
  const rows = gastos.map(g => [
    g.descricao,
    g.categoria,
    g.tipo === "mensal" ? "Mensal/Fixo" : "Gasto Diário",
    g.valor,
    formatDateBR(g.data_gasto),
    formatDateBR(g.created_at)
  ])

  const csvContent = [
    headers.join(";"),
    ...rows.map(row => row.map(escapeCSVValue).join(";"))
  ].join("\r\n")

  downloadCSV(csvContent, `despesas_${new Date().toISOString().split("T")[0]}.csv`)
}

export function exportDividasCSV(dividas: Divida[]) {
  const headers = [
    "Produto/Serviço",
    "Loja/Credor",
    "Valor Parcela (R$)",
    "Parcelas Pagas",
    "Total Parcelas",
    "Tipo de Valor",
    "Data Fechamento",
    "Data Início Pagamento",
    "Data Fim Pagamento",
    "Data de Criação"
  ]
  const rows = dividas.map(d => [
    d.produto,
    d.loja,
    d.valor_parcela,
    d.parcelas_pagas,
    d.total_parcelas,
    d.valor_variavel ? "Variável" : "Fixo",
    d.data_fechamento || "N/A",
    formatDateBR(d.data_inicio),
    formatDateBR(d.data_fim),
    formatDateBR(d.created_at)
  ])

  const csvContent = [
    headers.join(";"),
    ...rows.map(row => row.map(escapeCSVValue).join(";"))
  ].join("\r\n")

  downloadCSV(csvContent, `parcelamentos_${new Date().toISOString().split("T")[0]}.csv`)
}
