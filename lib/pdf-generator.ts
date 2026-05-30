import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Receita, Gasto, Divida, Poupanca } from "./types"

// Helper para formatar moeda em real brasileiro
const formatBRL = (val: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
}

// Helper para formatar data (YYYY-MM-DD para DD/MM/YYYY)
const formatDateBR = (dateStr: string) => {
  if (!dateStr) return ""
  try {
    const parts = dateStr.split("T")[0].split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  } catch (e) {}
  return dateStr
}

// Obter o nome do mês em português
function getMonthNamePT(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number)
  const date = new Date(year, month - 1, 15)
  const monthName = date.toLocaleDateString("pt-BR", { month: "long" })
  return monthName.charAt(0).toUpperCase() + monthName.slice(1) + " de " + year
}

export function generateMonthlyPDF(
  receitas: Receita[],
  gastos: Gasto[],
  dividas: Divida[],
  poupancas: Poupanca[],
  parcelasValores: any[],
  parcelasPagamentos: any[],
  selectedMonth: string,
  userEmail: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Margens: 15mm
  const marginX = 15
  let currentY = 15

  // 1. CABEÇALHO DO RELATÓRIO
  // Logo & Nome do App
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(30, 41, 59) // Slate-800
  doc.text("FinanzLivre", marginX, currentY)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139) // Slate-500
  doc.text("Gestão Financeira Pessoal 100% Grátis", marginX, currentY + 4)

  // Metadados do lado direito
  const rightAlignX = 195
  doc.setFontSize(9)
  doc.text(`Usuário: ${userEmail}`, rightAlignX, currentY, { align: "right" })
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, rightAlignX, currentY + 4, { align: "right" })

  currentY += 12

  // Título do Relatório
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(79, 70, 229) // Indigo-600 (Acento principal)
  doc.text("RELATÓRIO FINANCEIRO MENSAL", marginX, currentY)
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text(`Período de Referência: ${getMonthNamePT(selectedMonth)}`, marginX, currentY + 5)

  // Linha divisória
  currentY += 8
  doc.setDrawColor(79, 70, 229) // Indigo
  doc.setLineWidth(0.8)
  doc.line(marginX, currentY, rightAlignX, currentY)

  currentY += 8

  // 2. FILTRAR DADOS DO MÊS
  const filteredReceitas = receitas.filter(r => r.data_receita.startsWith(selectedMonth))
  const filteredGastosMensais = gastos.filter(g => g.tipo === "mensal" && g.data_gasto.startsWith(selectedMonth))
  const filteredGastosDiarios = gastos.filter(g => g.tipo === "diario" && g.data_gasto.startsWith(selectedMonth))
  const filteredPoupancas = poupancas.filter(p => p.data_poupanca.startsWith(selectedMonth))

  // Calcular parcelas do mês
  const [selYear, selMonth] = selectedMonth.split("-").map(Number)
  const parcelasDoMes: { divida: Divida; numero_parcela: number; valor: number; paga: boolean }[] = []

  dividas.forEach(divida => {
    const baseDateStr = divida.data_inicio || divida.data_fatura
    if (!baseDateStr) return
    const faturaDate = new Date(baseDateStr + "T12:00:00")

    for (let i = 1; i <= divida.total_parcelas; i++) {
      const dueDate = new Date(faturaDate)
      dueDate.setMonth(faturaDate.getMonth() + i - 1)
      
      if (dueDate.getFullYear() === selYear && (dueDate.getMonth() + 1) === selMonth) {
        const customVal = parcelasValores.find(
          pv => pv.divida_id === divida.id && Number(pv.numero_parcela) === i
        )
        const valorParcela = customVal ? Number(customVal.valor) : Number(divida.valor_parcela)
        const isPaga = i <= divida.parcelas_pagas

        parcelasDoMes.push({
          divida,
          numero_parcela: i,
          valor: valorParcela,
          paga: isPaga
        })
      }
    }
  })

  // Totais
  const totalReceitas = filteredReceitas.reduce((acc, r) => acc + Number(r.valor), 0)
  const totalGastosMensais = filteredGastosMensais.reduce((acc, g) => acc + Number(g.valor), 0)
  const totalGastosDiarios = filteredGastosDiarios.reduce((acc, g) => acc + Number(g.valor), 0)
  const totalParcelas = parcelasDoMes.reduce((acc, p) => acc + p.valor, 0)
  const totalPoupancas = filteredPoupancas.reduce((acc, p) => acc + Number(p.valor), 0)

  const totalSaidas = totalGastosMensais + totalGastosDiarios + totalParcelas
  const saldoFinal = totalReceitas - totalSaidas - totalPoupancas

  // 3. BLOCOS DE METRICAS (RESUMO)
  const boxWidth = 42
  const boxHeight = 16
  const boxGap = 4

  // Caixa 1: Receitas
  doc.setFillColor(240, 253, 244) // Light Green
  doc.rect(marginX, currentY, boxWidth, boxHeight, "F")
  doc.setDrawColor(220, 252, 231)
  doc.rect(marginX, currentY, boxWidth, boxHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(22, 101, 52) // Dark Green
  doc.text("TOTAL RECEITAS", marginX + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(formatBRL(totalReceitas), marginX + 3, currentY + 11)

  // Caixa 2: Despesas (Saídas)
  const xDespesas = marginX + boxWidth + boxGap
  doc.setFillColor(254, 242, 242) // Light Red
  doc.rect(xDespesas, currentY, boxWidth, boxHeight, "F")
  doc.setDrawColor(254, 226, 226)
  doc.rect(xDespesas, currentY, boxWidth, boxHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(153, 27, 27) // Dark Red
  doc.text("TOTAL DESPESAS", xDespesas + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(formatBRL(totalSaidas), xDespesas + 3, currentY + 11)

  // Caixa 3: Poupança (Economias)
  const xPoupanca = marginX + (boxWidth + boxGap) * 2
  doc.setFillColor(240, 253, 250) // Light Teal
  doc.rect(xPoupanca, currentY, boxWidth, boxHeight, "F")
  doc.setDrawColor(204, 251, 241)
  doc.rect(xPoupanca, currentY, boxWidth, boxHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(15, 118, 110) // Dark Teal
  doc.text("TOTAL POUPADO", xPoupanca + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(formatBRL(totalPoupancas), xPoupanca + 3, currentY + 11)

  // Caixa 4: Saldo Líquido
  const xSaldo = marginX + (boxWidth + boxGap) * 3
  const isPositivo = saldoFinal >= 0
  doc.setFillColor(isPositivo ? 240 : 254, isPositivo ? 253 : 242, isPositivo ? 244 : 242) // Green or Red
  doc.rect(xSaldo, currentY, boxWidth, boxHeight, "F")
  doc.setDrawColor(isPositivo ? 220 : 254, isPositivo ? 252 : 226, isPositivo ? 231 : 226)
  doc.rect(xSaldo, currentY, boxWidth, boxHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(isPositivo ? 22 : 153, isPositivo ? 101 : 27, isPositivo ? 52 : 27)
  doc.text("SALDO LÍQUIDO", xSaldo + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(formatBRL(saldoFinal), xSaldo + 3, currentY + 11)

  currentY += boxHeight + 10

  // 4. SEÇÕES DETALHADAS (TABELAS)

  // TABELA 1: RECEITAS
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text("1. Receitas Recebidas", marginX, currentY)
  currentY += 3

  if (filteredReceitas.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Descrição", "Data", "Valor (R$)"]],
      body: filteredReceitas.map(r => [
        r.descricao,
        formatDateBR(r.data_receita),
        { content: formatBRL(Number(r.valor)), styles: { halign: "right" } }
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 35, halign: "center" },
        2: { cellWidth: 40, halign: "right" }
      }
    })
    currentY = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text("Nenhuma receita cadastrada neste mês.", marginX, currentY + 3)
    currentY += 10
  }

  // TABELA 2: DESPESAS DIÁRIAS E FIXAS
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text("2. Despesas Fixas e Gastos do Mês", marginX, currentY)
  currentY += 3

  const totalGastosList = [...filteredGastosMensais, ...filteredGastosDiarios]

  if (totalGastosList.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Descrição", "Categoria", "Tipo", "Data", "Valor (R$)"]],
      body: totalGastosList.map(g => [
        g.descricao,
        g.categoria,
        g.tipo === "mensal" ? "Mensal/Fixo" : "Diário",
        formatDateBR(g.data_gasto),
        { content: formatBRL(Number(g.valor)), styles: { halign: "right" } }
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 35 },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 30, halign: "right" }
      }
    })
    currentY = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text("Nenhuma despesa ou gasto fixo cadastrado neste mês.", marginX, currentY + 3)
    currentY += 10
  }

  // TABELA 3: PARCELAS VENCENDO
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text("3. Compras Parceladas (Faturas do Mês)", marginX, currentY)
  currentY += 3

  if (parcelasDoMes.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Produto/Serviço", "Loja/Credor", "Nº Parcela", "Status", "Valor (R$)"]],
      body: parcelasDoMes.map(p => [
        p.divida.produto,
        p.divida.loja,
        `${p.numero_parcela}/${p.divida.total_parcelas}`,
        p.paga ? "Paga" : "Pendente",
        { content: formatBRL(p.valor), styles: { halign: "right" } }
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 40 },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 30, halign: "right" }
      }
    })
    currentY = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text("Nenhuma fatura de compra parcelada vencendo neste mês.", marginX, currentY + 3)
    currentY += 10
  }

  // TABELA 4: POUPANÇA
  if (currentY > 230) {
    doc.addPage()
    currentY = 15
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text("4. Poupança e Reserva Financeira", marginX, currentY)
  currentY += 3

  if (filteredPoupancas.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Descrição", "Data", "Valor Poupatório (R$)"]],
      body: filteredPoupancas.map(p => [
        p.descricao,
        formatDateBR(p.data_poupanca),
        { content: formatBRL(Number(p.valor)), styles: { halign: "right" } }
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 35, halign: "center" },
        2: { cellWidth: 45, halign: "right" }
      }
    })
    currentY = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text("Nenhuma economia guardada neste mês.", marginX, currentY + 3)
    currentY += 10
  }

  // RODAPÉ DAS PÁGINAS (Controle automático)
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    // Linha fina inferior
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(marginX, 282, rightAlignX, 282)
    // Textos
    doc.text("FinanzLivre - Sistema de Controle Financeiro Pessoal 100% Seguro e Grátis", marginX, 286)
    doc.text(`Página ${i} de ${pageCount}`, rightAlignX, 286, { align: "right" })
  }

  doc.save(`FinanzLivre_Relatorio_Mensal_${selectedMonth}.pdf`)
}

export function generateConsolidatedPDF(
  dividas: Divida[],
  receitas: Receita[],
  gastos: Gasto[],
  poupancas: Poupanca[],
  userEmail: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const marginX = 15
  let currentY = 15

  // 1. CABEÇALHO DO RELATÓRIO
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(30, 41, 59)
  doc.text("FinanzLivre", marginX, currentY)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text("Gestão Financeira Pessoal 100% Grátis", marginX, currentY + 4)

  const rightAlignX = 195
  doc.text(`Usuário: ${userEmail}`, rightAlignX, currentY, { align: "right" })
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, rightAlignX, currentY + 4, { align: "right" })

  currentY += 12

  // Título do Relatório
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(79, 70, 229)
  doc.text("RELATÓRIO CONSOLIDADO GERAL", marginX, currentY)
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text("Balanço Histórico de Finanças e Dívidas Ativas", marginX, currentY + 5)

  currentY += 8
  doc.setDrawColor(79, 70, 229)
  doc.setLineWidth(0.8)
  doc.line(marginX, currentY, rightAlignX, currentY)

  currentY += 8

  // 2. CÁLCULO GERAL ACUMULADO
  const acumuladoReceitas = receitas.reduce((acc, r) => acc + Number(r.valor), 0)
  const acumuladoGastos = gastos.reduce((acc, g) => acc + Number(g.valor), 0)
  const acumuladoPoupancas = poupancas.reduce((acc, p) => acc + Number(p.valor), 0)

  // Calcular valores totais de dívidas parceladas
  let totalOriginalDividas = 0
  let totalPagoDividas = 0
  let totalRestanteDividas = 0

  dividas.forEach(d => {
    const totalOriginal = Number(d.valor_parcela) * d.total_parcelas
    const totalPago = Number(d.valor_parcela) * d.parcelas_pagas
    const totalRestante = totalOriginal - totalPago

    totalOriginalDividas += totalOriginal
    totalPagoDividas += totalPago
    totalRestanteDividas += totalRestante
  })

  const totalSaidasAcumulado = acumuladoGastos + totalPagoDividas
  const saldoFinanceiroGeral = acumuladoReceitas - totalSaidasAcumulado - acumuladoPoupancas

  // 3. BLOCOS DE INFORMAÇÕES CONSOLIDADAS
  const boxWidth = 42
  const boxHeight = 16
  const boxGap = 4

  // Receitas Totais
  doc.setFillColor(240, 253, 244)
  doc.rect(marginX, currentY, boxWidth, boxHeight, "F")
  doc.setDrawColor(220, 252, 231)
  doc.rect(marginX, currentY, boxWidth, boxHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(22, 101, 52)
  doc.text("RECEITAS ACUMULADAS", marginX + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(formatBRL(acumuladoReceitas), marginX + 3, currentY + 11)

  // Despesas Diárias/Fixas + Pago em Parcelas
  const xDespesas = marginX + boxWidth + boxGap
  doc.setFillColor(254, 242, 242)
  doc.rect(xDespesas, currentY, boxWidth, boxHeight, "F")
  doc.setDrawColor(254, 226, 226)
  doc.rect(xDespesas, currentY, boxWidth, boxHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(153, 27, 27)
  doc.text("DESPESAS ACUMULADAS", xDespesas + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(formatBRL(totalSaidasAcumulado), xDespesas + 3, currentY + 11)

  // Economia / Reserva Acumulada
  const xPoupanca = marginX + (boxWidth + boxGap) * 2
  doc.setFillColor(240, 253, 250)
  doc.rect(xPoupanca, currentY, boxWidth, boxHeight, "F")
  doc.setDrawColor(204, 251, 241)
  doc.rect(xPoupanca, currentY, boxWidth, boxHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(15, 118, 110)
  doc.text("RESERVA ACUMULADA", xPoupanca + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(formatBRL(acumuladoPoupancas), xPoupanca + 3, currentY + 11)

  // Saldo Disponível Consolidado
  const xSaldo = marginX + (boxWidth + boxGap) * 3
  const isPositivo = saldoFinanceiroGeral >= 0
  doc.setFillColor(isPositivo ? 240 : 254, isPositivo ? 253 : 242, isPositivo ? 244 : 242)
  doc.rect(xSaldo, currentY, boxWidth, boxHeight, "F")
  doc.setDrawColor(isPositivo ? 220 : 254, isPositivo ? 252 : 226, isPositivo ? 231 : 226)
  doc.rect(xSaldo, currentY, boxWidth, boxHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(isPositivo ? 22 : 153, isPositivo ? 101 : 27, isPositivo ? 52 : 27)
  doc.text("SALDO DISPONÍVEL", xSaldo + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(formatBRL(saldoFinanceiroGeral), xSaldo + 3, currentY + 11)

  currentY += boxHeight + 10

  // 4. BALANÇO DE DÍVIDAS ATIVAS (RESUMO ADICIONAL)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text("Painel Consolidado de Parcelamentos", marginX, currentY)
  currentY += 4

  const divWidth = 56
  const divHeight = 14
  
  // Total Financiado
  doc.setFillColor(248, 250, 252)
  doc.rect(marginX, currentY, divWidth, divHeight, "F")
  doc.setDrawColor(226, 232, 240)
  doc.rect(marginX, currentY, divWidth, divHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text("Total Original Contratado", marginX + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(formatBRL(totalOriginalDividas), marginX + 3, currentY + 10)

  // Já Pago
  const xPago = marginX + divWidth + 6
  doc.setFillColor(248, 250, 252)
  doc.rect(xPago, currentY, divWidth, divHeight, "F")
  doc.setDrawColor(226, 232, 240)
  doc.rect(xPago, currentY, divWidth, divHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text("Total Amortizado (Pago)", xPago + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(22, 101, 52)
  doc.text(formatBRL(totalPagoDividas), xPago + 3, currentY + 10)

  // Saldo Devedor Restante
  const xRestante = xPago + divWidth + 6
  doc.setFillColor(248, 250, 252)
  doc.rect(xRestante, currentY, divWidth, divHeight, "F")
  doc.setDrawColor(226, 232, 240)
  doc.rect(xRestante, currentY, divWidth, divHeight, "D")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text("Saldo Devedor Restante", xRestante + 3, currentY + 5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(153, 27, 27)
  doc.text(formatBRL(totalRestanteDividas), xRestante + 3, currentY + 10)

  currentY += divHeight + 10

  // 5. LISTA GERAL DE COMPRAS PARCELADAS E CRONOGRAMAS
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text("1. Relação de Compras Parceladas & Progresso", marginX, currentY)
  currentY += 3

  if (dividas.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Produto", "Credor/Loja", "Parcelas", "Progresso", "Parcela", "Original", "Pago", "A Pagar"]],
      body: dividas.map(d => {
        const total = Number(d.valor_parcela) * d.total_parcelas
        const pago = Number(d.valor_parcela) * d.parcelas_pagas
        const restante = total - pago
        const percent = Math.round((d.parcelas_pagas / d.total_parcelas) * 100)

        return [
          d.produto,
          d.loja,
          `${d.parcelas_pagas}/${d.total_parcelas}`,
          `${percent}%`,
          { content: formatBRL(Number(d.valor_parcela)), styles: { halign: "right" } },
          { content: formatBRL(total), styles: { halign: "right" } },
          { content: formatBRL(pago), styles: { halign: "right" } },
          { content: formatBRL(restante), styles: { halign: "right" } }
        ]
      }),
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 25 },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 20, halign: "right" },
        7: { cellWidth: 20, halign: "right" }
      }
    })
    currentY = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text("Nenhuma compra parcelada cadastrada no sistema.", marginX, currentY + 3)
    currentY += 10
  }

  // 6. HISTÓRICO DE POUPANÇA E RESERVAS
  if (currentY > 220) {
    doc.addPage()
    currentY = 15
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text("2. Histórico Geral de Economias (Poupança)", marginX, currentY)
  currentY += 3

  if (poupancas.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [["Descrição", "Data", "Valor Depositado (R$)"]],
      body: poupancas.map(p => [
        p.descricao,
        formatDateBR(p.data_poupanca),
        { content: formatBRL(Number(p.valor)), styles: { halign: "right" } }
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 35, halign: "center" },
        2: { cellWidth: 45, halign: "right" }
      }
    })
    currentY = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text("Nenhum registro de poupança/reserva cadastrado.", marginX, currentY + 3)
    currentY += 10
  }

  // RODAPÉ CONSOLIDADO
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(marginX, 282, rightAlignX, 282)
    doc.text("FinanzLivre - Sistema de Controle Financeiro Pessoal 100% Seguro e Grátis", marginX, 286)
    doc.text(`Página ${i} de ${pageCount}`, rightAlignX, 286, { align: "right" })
  }

  doc.save("FinanzLivre_Relatorio_Consolidado_Geral.pdf")
}
