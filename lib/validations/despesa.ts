import { z } from 'zod'

export const despesaSchema = z.object({
  relatorioId: z.number().int().positive('Relatório é obrigatório'),
  categoriaId: z.number().int().positive('Categoria é obrigatória'),
  dataDespesa: z.date({ message: 'Data da despesa é obrigatória' }),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(255, 'Descrição muito longa'),
  fornecedor: z.string().optional(),
  valor: z.number().positive('Valor deve ser positivo'),
  observacoes: z.string().optional(),
  reembolsavel: z.boolean().default(true),
  clienteACobrar: z.boolean().default(true),
  reembolsada: z.boolean().default(false),
})

export const despesaQuilometragemSchema = z.object({
  veiculoId: z.number().int().positive('Veículo é obrigatório'),
  origem: z.string().min(1, 'Origem é obrigatória'),
  destino: z.string().min(1, 'Destino é obrigatório'),
  distanciaKm: z.number().positive('Distância deve ser positiva'),
  valorPorKm: z.number().positive('Valor por km deve ser positivo'),
})

export type DespesaFormData = z.infer<typeof despesaSchema>
export type DespesaQuilometragemFormData = z.infer<typeof despesaQuilometragemSchema>