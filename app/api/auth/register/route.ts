import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, createSession } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = registerSchema.parse(body)
    
    // Verificar se o usuário já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'E-mail já está em uso' },
        { status: 400 }
      )
    }
    
    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password)
    
    // Criar usuário
    const user = await prisma.usuario.create({
      data: {
        nome: validatedData.nome,
        email: validatedData.email,
        senha: hashedPassword,
      }
    })
    
    // Criar sessão automaticamente após registro
    const sessionPayload = {
      userId: user.id,
      email: user.email,
      nome: user.nome
    }
    
    await createSession(sessionPayload)
    
    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Register error:', error)
    
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