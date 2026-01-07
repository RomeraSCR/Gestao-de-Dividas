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
}
