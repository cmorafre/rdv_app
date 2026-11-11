import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { escopoNotificacao } from '@/lib/escopo'

// Consulta leve para o polling do sininho: quantas não lidas e o id da mais recente
// (o site compara com o último id visto para disparar o aviso do navegador)
export async function GET(request: NextRequest) {
  try {
    const sessao = await requireAuth(request)
    if (sessao instanceof NextResponse) return sessao

    const escopo = escopoNotificacao(sessao)
    const [naoLidas, ultima] = await Promise.all([
      prisma.notificacao.count({ where: { ...escopo, lidaEm: null } }),
      prisma.notificacao.findFirst({ where: escopo, orderBy: { id: 'desc' }, select: { id: true } }),
    ])

    return NextResponse.json({ naoLidas, ultimaId: ultima?.id ?? null })
  } catch (error) {
    console.error('Erro ao contar notificações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
