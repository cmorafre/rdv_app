import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    
    if (session instanceof NextResponse) {
      return session
    }
    
    const conta = await prisma.conta.findUnique({
      where: { id: session.contaId },
      select: { id: true, nome: true, tipo: true }
    })

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        nome: session.nome,
        perfil: session.perfil,
        conta
      }
    })
    
  } catch (error) {
    console.error('Session error:', error)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}