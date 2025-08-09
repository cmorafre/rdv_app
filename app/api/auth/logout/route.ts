import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await destroySession()
    
    return NextResponse.json({
      message: 'Logout realizado com sucesso'
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}