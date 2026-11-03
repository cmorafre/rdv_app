import { NextRequest } from 'next/server'
import { executarAcao } from '@/lib/acao-relatorio'

// Gestor registra o reembolso de um relatório aprovado: marca as despesas reembolsáveis
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return executarAcao(request, params, {
    acao: 'reembolsar',
    de: ['aprovado'],
    dados: () => ({ status: 'reembolsado' }),
    depois: async (tx, relatorio) => {
      await tx.despesa.updateMany({
        where: { relatorioId: relatorio.id, reembolsavel: true, reembolsada: false },
        data: { reembolsada: true },
      })
    },
  })
}
