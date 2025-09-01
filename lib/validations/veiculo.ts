import { z } from 'zod'

export const veiculoSchema = z.object({
  tipo: z.enum(['pessoal', 'empresa', 'financiado', 'alugado'], {
    message: 'Tipo de veículo é obrigatório'
  }),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  categoria: z.string().optional(),
  combustivel: z.enum(['gasolina', 'etanol', 'flex', 'diesel', 'gas', 'eletrico', 'hibrido']).optional(),
  identificacao: z.string().optional(),
  potencia: z.number().int().positive().optional(),
  valorPorKm: z.number().positive('Valor por km deve ser positivo'),
  ativo: z.boolean().default(true),
})

export type VeiculoFormData = z.infer<typeof veiculoSchema>