import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const VeiculoCreateSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  combustivel: z.string().optional().nullable(),
  identificacao: z.string().min(1, "Identificação é obrigatória"),
  potencia: z.number().int().positive().optional().nullable(),
  valorPorKm: z.number().positive("Valor por Km deve ser positivo"),
  ativo: z.boolean().default(true),
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
    const tipo = searchParams.get('tipo')
    const ativo = searchParams.get('ativo')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Construir where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = {}

    if (!includeInactive) {
      whereClause.ativo = true
    }

    if (busca) {
      whereClause.OR = [
        { tipo: { contains: busca, mode: 'insensitive' } },
        { marca: { contains: busca, mode: 'insensitive' } },
        { modelo: { contains: busca, mode: 'insensitive' } },
        { identificacao: { contains: busca, mode: 'insensitive' } }
      ]
    }

    if (tipo && tipo !== 'all') {
      whereClause.tipo = tipo
    }

    if (ativo && ativo !== 'all') {
      whereClause.ativo = ativo === 'true'
    }

    // Contar total de registros
    const total = await prisma.veiculo.count({ where: whereClause })

    // Buscar veículos com paginação
    const veiculos = await prisma.veiculo.findMany({
      where: whereClause,
      orderBy: [
        { ativo: 'desc' }, // Ativos primeiro
        { tipo: 'asc' },
        { marca: 'asc' },
        { modelo: 'asc' }
      ],
      skip,
      take: pageSize
    })

    return NextResponse.json({
      veiculos,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Erro ao buscar veículos:', error)
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
    const validatedData = VeiculoCreateSchema.parse(body)

    // Verificar se já existe um veículo com a mesma identificação
    const existingVeiculo = await prisma.veiculo.findUnique({
      where: { identificacao: validatedData.identificacao }
    })

    if (existingVeiculo) {
      return NextResponse.json(
        { error: "Já existe um veículo com esta identificação" },
        { status: 400 }
      )
    }

    const veiculo = await prisma.veiculo.create({
      data: validatedData
    })

    return NextResponse.json(veiculo, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar veículo:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}