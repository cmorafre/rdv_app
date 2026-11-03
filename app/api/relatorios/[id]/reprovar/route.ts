import { NextRequest } from 'next/server'
import { executarAcao } from '@/lib/acao-relatorio'

// Gestor devolve o relatório ao dono, com o motivo
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return executarAcao(request, params, {
    acao: 'reprovar',
    de: ['enviado'],
    validar: (_relatorio, body) => {
      const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''
      if (motivo.length < 3) return 'Informe o motivo da reprovação.'
      if (motivo.length > 1000) return 'O motivo pode ter no máximo 1000 caracteres.'
      return null
    },
    dados: (_relatorio, sessao, body) => ({
      status: 'reprovado',
      motivoReprovacao: String(body.motivo).trim(),
      aprovadoEm: null,
      aprovadoPorId: sessao.userId,
    }),
  })
}
