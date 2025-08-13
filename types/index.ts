// Definições de tipos TypeScript
import type { Relatorio, Despesa, Categoria, Veiculo, DespesaQuilometragem } from '@prisma/client'

// Tipos do banco de dados
export type {
  Relatorio,
  Despesa,
  Categoria,
  Veiculo,
  DespesaQuilometragem
} from '@prisma/client'

// Tipos relacionais
export type RelatorioWithDespesas = Relatorio & {
  despesas: (Despesa & {
    categoria: Categoria
    despesaQuilometragem?: DespesaQuilometragem & {
      veiculo: Veiculo
    }
  })[]
}

export type DespesaWithRelations = Despesa & {
  relatorio: Relatorio
  categoria: Categoria
  despesaQuilometragem?: DespesaQuilometragem & {
    veiculo: Veiculo
  }
}

// Status dos relatórios
export const RELATORIO_STATUS = {
  EM_ANDAMENTO: 'em_andamento',
  REEMBOLSADO: 'reembolsado'
} as const

export type RelatorioStatus = typeof RELATORIO_STATUS[keyof typeof RELATORIO_STATUS]

// Tipos de veículos
export const VEICULO_TIPOS = {
  PESSOAL: 'pessoal',
  EMPRESA: 'empresa',
  FINANCIADO: 'financiado',
  ALUGADO: 'alugado'
} as const

export type VeiculoTipo = typeof VEICULO_TIPOS[keyof typeof VEICULO_TIPOS]

// Combustíveis
export const COMBUSTIVEIS = {
  GASOLINA: 'gasolina',
  ETANOL: 'etanol',
  FLEX: 'flex',
  DIESEL: 'diesel',
  GAS: 'gas',
  ELETRICO: 'eletrico',
  HIBRIDO: 'hibrido'
} as const

export type CombustivelTipo = typeof COMBUSTIVEIS[keyof typeof COMBUSTIVEIS]