import { NextRequest } from 'next/server'
import { executarAcao } from '@/lib/acao-relatorio'

// Dono desiste do envio enquanto o gestor ainda não decidiu
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return executarAcao(request, params, {
    acao: 'cancelarEnvio',
    de: ['enviado'],
    dados: () => ({ status: 'em_andamento', enviadoEm: null }),
  })
}
