import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const RelatorioCreateSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  dataInicio: z.string().transform((val) => new Date(val)),
  dataFim: z.string().transform((val) => new Date(val)),
  destino: z.string().optional().nullable(),
  proposito: z.string().optional().nullable(),
  status: z.string().default("em_andamento"),
  cliente: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    // Se requireAuth retorna NextResponse, é um erro
    if (authResult instanceof NextResponse) {
      return authResult
    }
    
    const _user = authResult

    const { searchParams } = new URL(request.url)
    
    // Paginação
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize

    // Filtros
    const busca = searchParams.get('busca') || ''
    const status = searchParams.get('status') || ''
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const cliente = searchParams.get('cliente') || ''

    // Construir where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = {}

    if (busca) {
      whereClause.OR = [
        { titulo: { contains: busca, mode: 'insensitive' } },
        { destino: { contains: busca, mode: 'insensitive' } },
        { cliente: { contains: busca, mode: 'insensitive' } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (cliente) {
      whereClause.cliente = { contains: cliente, mode: 'insensitive' }
    }

    if (dataInicio) {
      whereClause.dataInicio = { gte: new Date(dataInicio) }
    }

    if (dataFim) {
      whereClause.dataFim = { lte: new Date(dataFim) }
    }

    // Contar total de registros
    const total = await prisma.relatorio.count({ where: whereClause })

    // Buscar relatórios com paginação
    const relatorios = await prisma.relatorio.findMany({
      where: whereClause,
      include: {
        despesas: {
          include: {
            categoria: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    })

    const relatoriosComTotal = relatorios.map(relatorio => ({
      ...relatorio,
      valorTotal: relatorio.despesas.reduce((total, despesa) => total + Number(despesa.valor), 0),
      totalDespesas: relatorio.despesas.length
    }))

    return NextResponse.json({
      relatorios: relatoriosComTotal,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    // Se requireAuth retorna NextResponse, é um erro
    if (authResult instanceof NextResponse) {
      return authResult
    }
    
    const _user = authResult

    const body = await request.json()
    const validatedData = RelatorioCreateSchema.parse(body)

    if (validatedData.dataFim < validatedData.dataInicio) {
      return NextResponse.json(
        { error: "Data fim deve ser maior que data início" },
        { status: 400 }
      )
    }

    const relatorio = await prisma.relatorio.create({
      data: validatedData,
      include: {
        despesas: {
          include: {
            categoria: true
          }
        }
      }
    })

    return NextResponse.json(relatorio, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar relatório:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}