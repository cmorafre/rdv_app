import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const RelatorioUpdateSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").optional(),
  dataInicio: z.string().transform((val) => new Date(val)).optional(),
  dataFim: z.string().transform((val) => new Date(val)).optional(),
  destino: z.string().optional().nullable(),
  proposito: z.string().optional().nullable(),
  status: z.string().optional(),
  cliente: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const relatorio = await prisma.relatorio.findUnique({
      where: { id },
      include: {
        despesas: {
          include: {
            categoria: true,
            despesaQuilometragem: {
              include: {
                veiculo: true
              }
            }
          },
          orderBy: {
            dataDespesa: 'desc'
          }
        }
      }
    })

    if (!relatorio) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      )
    }

    const relatorioComTotal = {
      ...relatorio,
      valorTotal: relatorio.despesas.reduce((total, despesa) => total + Number(despesa.valor), 0),
      totalDespesas: relatorio.despesas.length
    }

    return NextResponse.json(relatorioComTotal)
  } catch (error) {
    console.error('Erro ao buscar relatório:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = RelatorioUpdateSchema.parse(body)

    if (validatedData.dataInicio && validatedData.dataFim && validatedData.dataFim < validatedData.dataInicio) {
      return NextResponse.json(
        { error: "Data fim deve ser maior que data início" },
        { status: 400 }
      )
    }

    const existingRelatorio = await prisma.relatorio.findUnique({
      where: { id }
    })

    if (!existingRelatorio) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      )
    }

    const relatorio = await prisma.relatorio.update({
      where: { id },
      data: validatedData,
      include: {
        despesas: {
          include: {
            categoria: true,
            despesaQuilometragem: {
              include: {
                veiculo: true
              }
            }
          }
        }
      }
    })

    const relatorioComTotal = {
      ...relatorio,
      valorTotal: relatorio.despesas.reduce((total, despesa) => total + Number(despesa.valor), 0),
      totalDespesas: relatorio.despesas.length
    }

    return NextResponse.json(relatorioComTotal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar relatório:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const existingRelatorio = await prisma.relatorio.findUnique({
      where: { id },
      include: {
        despesas: true
      }
    })

    if (!existingRelatorio) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      )
    }

    if (existingRelatorio.despesas.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir um relatório que possui despesas associadas" },
        { status: 400 }
      )
    }

    await prisma.relatorio.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Relatório excluído com sucesso" })
  } catch (error) {
    console.error('Erro ao excluir relatório:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}