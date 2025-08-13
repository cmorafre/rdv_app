import { z } from 'zod'

export const relatorioSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  dataInicio: z.date({ required_error: 'Data de início é obrigatória' }),
  dataFim: z.date({ required_error: 'Data de fim é obrigatória' }),
  destino: z.string().optional(),
  proposito: z.string().optional(),
  status: z.enum(['em_andamento', 'reembolsado']).default('em_andamento'),
  cliente: z.string().optional(),
  observacoes: z.string().optional(),
}).refine(
  (data) => data.dataFim >= data.dataInicio,
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['dataFim'],
  }
)

export type RelatorioFormData = z.infer<typeof relatorioSchema>