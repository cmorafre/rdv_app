import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { tokenExpoValido } from '@/lib/push'

async function lerCorpo(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) ?? {}
  } catch {
    return {}
  }
}

// O app registra o celular depois do login. Se o token já era de outro usuário
// (troca de conta no mesmo celular), passa a ser de quem está logado agora
export async function POST(request: NextRequest) {
  try {
    const sessao = await requireAuth(request)
    if (sessao instanceof NextResponse) return sessao

    const body = await lerCorpo(request)
    if (!tokenExpoValido(body.token)) {
      return NextResponse.json({ error: 'Token de push inválido' }, { status: 400 })
    }
    const plataforma = body.plataforma === 'ios' ? 'ios' : 'android'

    await prisma.dispositivo.upsert({
      where: { token: body.token },
      create: { token: body.token, plataforma, usuarioId: sessao.userId },
      update: { plataforma, usuarioId: sessao.userId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao registrar dispositivo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// O app remove o celular ao sair da conta (só o próprio token do usuário logado)
export async function DELETE(request: NextRequest) {
  try {
    const sessao = await requireAuth(request)
    if (sessao instanceof NextResponse) return sessao

    const body = await lerCorpo(request)
    if (!tokenExpoValido(body.token)) {
      return NextResponse.json({ error: 'Token de push inválido' }, { status: 400 })
    }

    const { count } = await prisma.dispositivo.deleteMany({ where: { token: body.token, usuarioId: sessao.userId } })
    return NextResponse.json({ removidos: count })
  } catch (error) {
    console.error('Erro ao remover dispositivo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
