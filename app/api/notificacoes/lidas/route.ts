import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { escopoNotificacao } from '@/lib/escopo'

// Marca todas as notificações do usuário logado como lidas
export async function POST(request: NextRequest) {
  try {
    const sessao = await requireAuth(request)
    if (sessao instanceof NextResponse) return sessao

    const { count } = await prisma.notificacao.updateMany({
      where: { ...escopoNotificacao(sessao), lidaEm: null },
      data: { lidaEm: new Date() },
    })

    return NextResponse.json({ marcadas: count })
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
