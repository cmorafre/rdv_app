import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { escopoNotificacao } from '@/lib/escopo'

// Lista as notificações do usuário logado, mais novas primeiro.
//   ?limite=20     quantas trazer (1 a 50)
//   ?antesDe=123   paginação: só as com id menor que este
//   ?naoLidas=true só as não lidas
export async function GET(request: NextRequest) {
  try {
    const sessao = await requireAuth(request)
    if (sessao instanceof NextResponse) return sessao

    const { searchParams } = new URL(request.url)
    const limite = Math.min(Math.max(parseInt(searchParams.get('limite') ?? '20') || 20, 1), 50)
    const antesDe = parseInt(searchParams.get('antesDe') ?? '')
    const soNaoLidas = searchParams.get('naoLidas') === 'true'

    const escopo = escopoNotificacao(sessao)
    const [itens, naoLidas] = await Promise.all([
      prisma.notificacao.findMany({
        where: {
          ...escopo,
          ...(isNaN(antesDe) ? {} : { id: { lt: antesDe } }),
          ...(soNaoLidas ? { lidaEm: null } : {}),
        },
        orderBy: { id: 'desc' },
        take: limite + 1,
        select: {
          id: true,
          tipo: true,
          titulo: true,
          mensagem: true,
          relatorioId: true,
          lidaEm: true,
          createdAt: true,
          autor: { select: { id: true, nome: true } },
        },
      }),
      prisma.notificacao.count({ where: { ...escopo, lidaEm: null } }),
    ])

    return NextResponse.json({
      notificacoes: itens.slice(0, limite),
      temMais: itens.length > limite,
      naoLidas,
    })
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
