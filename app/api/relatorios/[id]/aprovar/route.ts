import { NextRequest } from 'next/server'
import { executarAcao } from '@/lib/acao-relatorio'

// Gestor aprova um relatório enviado
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return executarAcao(request, params, {
    acao: 'aprovar',
    de: ['enviado'],
    dados: (_relatorio, sessao) => ({
      status: 'aprovado',
      aprovadoEm: new Date(),
      aprovadoPorId: sessao.userId,
      motivoReprovacao: null,
    }),
  })
}
