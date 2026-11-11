import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { escopoNotificacao } from '@/lib/escopo'

// Marca uma notificação como lida (notificação de outro usuário → 404)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessao = await requireAuth(request)
    if (sessao instanceof NextResponse) return sessao

    const id = parseInt((await params).id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const notificacao = await prisma.notificacao.findFirst({ where: { id, ...escopoNotificacao(sessao) }, select: { id: true, lidaEm: true } })
    if (!notificacao) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    const lidaEm = notificacao.lidaEm ?? new Date()
    if (!notificacao.lidaEm) {
      await prisma.notificacao.update({ where: { id }, data: { lidaEm } })
    }

    return NextResponse.json({ id, lidaEm })
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
