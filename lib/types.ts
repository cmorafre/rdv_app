// Tipos para o sistema de adiantamentos
export interface RelatorioComAdiantamento {
  id: number
  titulo: string
  dataInicio: string
  dataFim: string
  destino?: string
  proposito?: string
  status: string
  cliente?: string
  observacoes?: string
  valorTotal: number
  adiantamento: number
  saldoRestante: number
  valorReembolso?: number
  statusReembolso: 'pendente' | 'reembolsado' | 'devolvido'
  createdAt: string
  updatedAt: string
}

export interface CalculoAdiantamento {
  adiantamento: number
  valorTotal: number
  saldoRestante: number
  valorReembolso: number
  statusReembolso: 'pendente' | 'receber' | 'devolver' | 'quitado'
  tipoReembolso: 'A_RECEBER' | 'A_DEVOLVER' | 'QUITADO'
}

export interface FormularioRelatorio {
  titulo: string
  dataInicio: string
  dataFim: string
  destino?: string
  proposito?: string
  cliente?: string
  observacoes?: string
  adiantamento?: number
}

export interface SaldoDisplayProps {
  saldoRestante: number
  valorReembolso?: number
  statusReembolso: string
  size?: 'sm' | 'md' | 'lg'
  showReembolso?: boolean
}

export interface ReembolsoInfo {
  valor: number
  tipo: 'A_RECEBER' | 'A_DEVOLVER' | 'QUITADO'
  status: 'pendente' | 'processado'
  descricao: string
  cor: 'green' | 'red' | 'gray'
}