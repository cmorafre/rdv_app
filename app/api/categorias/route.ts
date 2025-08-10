import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const CategoriaCreateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  icone: z.string().optional().nullable(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal").optional().nullable(),
  ativa: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const whereClause = includeInactive ? {} : { ativa: true }

    const categorias = await prisma.categoria.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
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
    const validatedData = CategoriaCreateSchema.parse(body)

    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategoria = await prisma.categoria.findFirst({
      where: { 
        nome: {
          equals: validatedData.nome,
          mode: 'insensitive'
        }
      }
    })

    if (existingCategoria) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 409 }
      )
    }

    const categoria = await prisma.categoria.create({
      data: validatedData
    })

    return NextResponse.json(categoria, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}