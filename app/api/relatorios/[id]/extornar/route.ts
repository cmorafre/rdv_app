import { NextRequest } from 'next/server'
import { executarAcao } from '@/lib/acao-relatorio'

// Gestor desfaz o reembolso: o relatório volta a aprovado e as despesas a não reembolsadas
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return executarAcao(request, params, {
    acao: 'extornar',
    de: ['reembolsado'],
    dados: () => ({ status: 'aprovado' }),
    depois: async (tx, relatorio) => {
      await tx.despesa.updateMany({
        where: { relatorioId: relatorio.id, reembolsavel: true, reembolsada: true },
        data: { reembolsada: false },
      })
    },
  })
}
