import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const UsuarioCreateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    
    // Paginação
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize

    // Filtros
    const busca = searchParams.get('busca') || ''

    // Construir where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = {}

    if (busca) {
      whereClause.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { email: { contains: busca, mode: 'insensitive' } }
      ]
    }

    // Contar total de registros
    const total = await prisma.usuario.count({ where: whereClause })

    // Buscar usuários com paginação (excluindo senha)
    const usuarios = await prisma.usuario.findMany({
      where: whereClause,
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        nome: 'asc'
      },
      skip,
      take: pageSize
    })

    return NextResponse.json({
      usuarios,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const validatedData = UsuarioCreateSchema.parse(body)

    // Verificar se já existe usuário com este email
    const existingUser = await prisma.usuario.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe um usuário com este e-mail" },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.senha, 10)

    // Criar usuário
    const usuario = await prisma.usuario.create({
      data: {
        nome: validatedData.nome,
        email: validatedData.email,
        senha: hashedPassword,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}