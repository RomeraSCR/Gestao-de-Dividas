export interface ParcelaValor {
  id: string
  divida_id: string
  numero_parcela: number
  valor: number
}

export interface Divida {
  id: string
  user_id: string
  autor: string
  produto: string
  loja: string
  data_fatura: string
  total_parcelas: number
  parcelas_pagas: number
  valor_parcela: number
  valor_variavel: boolean
  data_fechamento?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  created_at: string
  updated_at: string
}

export interface DividaFormData {
  autor: string
  produto: string
  loja: string
  data_fatura: string
  total_parcelas: number
  parcelas_pagas: number
  valor_parcela: number
  valor_variavel: boolean
  data_fechamento?: string | null
  data_inicio?: string | null
  data_fim?: string | null
}

export interface Receita {
  id: string
  user_id: string
  valor: number
  descricao: string
  data_receita: string
  created_at: string
}

export interface Gasto {
  id: string
  user_id: string
  valor: number
  descricao: string
  categoria: string
  data_gasto: string
  tipo: "mensal" | "diario"
  created_at: string
}

export interface Poupanca {
  id: string
  user_id: string
  valor: number
  descricao: string
  data_poupanca: string
  created_at: string
}
