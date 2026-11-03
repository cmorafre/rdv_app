import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { executarAcao } from '@/lib/acao-relatorio'

// Dono envia o relatório para o gestor aprovar
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return executarAcao(request, params, {
    acao: 'enviar',
    de: ['em_andamento', 'reprovado'],
    validar: async (relatorio) => {
      const despesas = await prisma.despesa.count({ where: { relatorioId: relatorio.id } })
      return despesas === 0 ? 'Adicione ao menos uma despesa antes de enviar.' : null
    },
    dados: () => ({
      status: 'enviado',
      enviadoEm: new Date(),
      aprovadoEm: null,
      aprovadoPorId: null,
      motivoReprovacao: null,
    }),
  })
}
