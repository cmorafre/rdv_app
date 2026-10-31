import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    
    if (session instanceof NextResponse) {
      return session
    }
    
    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        nome: session.nome
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