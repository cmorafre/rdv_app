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

export async function GET() {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const relatorios = await prisma.relatorio.findMany({
      include: {
        despesas: {
          include: {
            categoria: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const relatoriosComTotal = relatorios.map(relatorio => ({
      ...relatorio,
      valorTotal: relatorio.despesas.reduce((total, despesa) => total + Number(despesa.valor), 0),
      totalDespesas: relatorio.despesas.length
    }))

    return NextResponse.json(relatoriosComTotal)
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
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

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
        { error: "Dados inválidos", details: error.errors },
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