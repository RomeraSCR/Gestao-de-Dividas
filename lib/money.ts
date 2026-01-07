export function parsePtBrMoneyInput(raw: string): number | null {
  if (!raw) return null
  const s0 = String(raw).trim()
  if (!s0) return null

  // Remove moeda/espaços e mantém apenas dígitos e separadores comuns
  let s = s0.replace(/[^\d.,-]/g, "")
  if (!s) return null

  const negative = s.startsWith("-")
  s = s.replace(/-/g, "")

  const hasComma = s.includes(",")
  const hasDot = s.includes(".")

  // Caso 1: tem vírgula e ponto -> padrão pt-BR (ponto milhar, vírgula decimal)
  if (hasComma && hasDot) {
    s = s.replace(/\./g, "").replace(",", ".")
  } else if (hasComma) {
    // Caso 2: só vírgula -> vírgula decimal (remover pontos residuais se existirem)
    s = s.replace(/\./g, "").replace(",", ".")
  } else if (hasDot) {
    // Caso 3: só ponto -> pode ser decimal ou milhar
    const parts = s.split(".")
    const last = parts[parts.length - 1] ?? ""
    if (last.length <= 2) {
      // considerar decimal; remover pontos extras (milhar) mantendo o último como decimal
      if (parts.length > 2) {
        const dec = parts.pop() as string
        s = parts.join("") + "." + dec
      }
      // se só 1 ponto, já está ok
    } else {
      // considerar milhar; remover todos os pontos
      s = s.replace(/\./g, "")
    }
  }

  // Limitar a 2 casas decimais (se houver)
  if (s.includes(".")) {
    const [intPart, decPart = ""] = s.split(".")
    s = intPart + "." + decPart.slice(0, 2)
  }

  const n = Number.parseFloat(s)
  if (Number.isNaN(n)) return null

  const rounded = Math.round(n * 100) / 100
  return negative ? -rounded : rounded
}

export function formatPtBrMoneyInput(value: number): string {
  if (!Number.isFinite(value)) return ""
  const v = Math.round(value * 100) / 100
  // Sem separador de milhar (mais estável em input)
  return v.toFixed(2).replace(".", ",")
}

export function formatPtBrMoney(value: number, opts?: { useGrouping?: boolean }): string {
  if (!Number.isFinite(value)) return "0,00"
  return value.toLocaleString("pt-BR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: opts?.useGrouping ?? true,
  })
}

export function digitsToCents(digits: string, maxDigits = 12): number {
  const d = String(digits || "").replace(/\D/g, "").slice(0, maxDigits)
  return d ? Number(d) : 0
}

export function centsToNumber(cents: number): number {
  return fromCents(cents)
}

export function formatCentsPtBr(cents: number, opts?: { useGrouping?: boolean }): string {
  return formatPtBrMoney(centsToNumber(cents), opts)
}

export function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100)
}

export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0
  return cents / 100
}

export function sumMoney(values: Array<number | null | undefined>): number {
  const cents = values.reduce<number>((acc, v) => acc + toCents(Number(v) || 0), 0)
  return fromCents(cents)
}

export function mulMoney(value: number, multiplier: number): number {
  const cents = toCents(Number(value) || 0) * (Number(multiplier) || 0)
  return fromCents(cents)
}


