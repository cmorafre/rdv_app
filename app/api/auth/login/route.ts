import { NextRequest, NextResponse } from 'next/server'
import { authenticate, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = loginSchema.parse(body)
    
    // Autenticar usuário
    const user = await authenticate(validatedData.email, validatedData.password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 }
      )
    }
    
    // Criar sessão
    await createSession(user)
    
    return NextResponse.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.userId,
        email: user.email,
        nome: user.nome
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}