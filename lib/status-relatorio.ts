// Rótulos e cores dos status do relatório (usado no site; o fluxo fica em lib/fluxo-relatorio.ts)
export const STATUS_RELATORIO_INFO = {
  em_andamento: { label: 'Em andamento', className: 'bg-slate-100 text-slate-800 border-slate-200' },
  enviado: { label: 'Aguardando aprovação', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  aprovado: { label: 'Aprovado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  reprovado: { label: 'Reprovado', className: 'bg-red-100 text-red-800 border-red-200' },
  reembolsado: { label: 'Reembolsado', className: 'bg-green-100 text-green-800 border-green-200' },
} as const

export type StatusRelatorioSite = keyof typeof STATUS_RELATORIO_INFO

export function infoStatus(status: string) {
  return STATUS_RELATORIO_INFO[status as StatusRelatorioSite] ?? { label: status, className: '' }
}

export interface AcoesRelatorio {
  editar: boolean
  enviar: boolean
  cancelarEnvio: boolean
  aprovar: boolean
  reprovar: boolean
  reembolsar: boolean
  extornar: boolean
}
