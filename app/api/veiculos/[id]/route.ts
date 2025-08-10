import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const VeiculoUpdateSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório").optional(),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  combustivel: z.string().optional().nullable(),
  identificacao: z.string().min(1, "Identificação é obrigatória").optional(),
  potencia: z.number().int().positive().optional().nullable(),
  valorPorKm: z.number().positive("Valor por Km deve ser positivo").optional(),
  ativo: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const veiculo = await prisma.veiculo.findUnique({
      where: { id },
      include: {
        despesasQuilometragem: {
          include: {
            despesa: {
              include: {
                relatorio: {
                  select: {
                    id: true,
                    titulo: true
                  }
                }
              }
            }
          },
          orderBy: {
            despesa: {
              dataDespesa: 'desc'
            }
          },
          take: 10 // Últimas 10 despesas de quilometragem
        }
      }
    })

    if (!veiculo) {
      return NextResponse.json(
        { error: "Veículo não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(veiculo)
  } catch (error) {
    console.error('Erro ao buscar veículo:', error)
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
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
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
    const validatedData = VeiculoUpdateSchema.parse(body)

    const existingVeiculo = await prisma.veiculo.findUnique({
      where: { id }
    })

    if (!existingVeiculo) {
      return NextResponse.json(
        { error: "Veículo não encontrado" },
        { status: 404 }
      )
    }

    // Se está mudando a identificação, verificar se não existe outro veículo com a mesma
    if (validatedData.identificacao && validatedData.identificacao !== existingVeiculo.identificacao) {
      const duplicateVeiculo = await prisma.veiculo.findUnique({
        where: { identificacao: validatedData.identificacao }
      })

      if (duplicateVeiculo) {
        return NextResponse.json(
          { error: "Já existe um veículo com esta identificação" },
          { status: 400 }
        )
      }
    }

    const veiculo = await prisma.veiculo.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(veiculo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar veículo:', error)
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
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const existingVeiculo = await prisma.veiculo.findUnique({
      where: { id },
      include: {
        despesasQuilometragem: true
      }
    })

    if (!existingVeiculo) {
      return NextResponse.json(
        { error: "Veículo não encontrado" },
        { status: 404 }
      )
    }

    if (existingVeiculo.despesasQuilometragem.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir um veículo que possui despesas de quilometragem associadas" },
        { status: 400 }
      )
    }

    await prisma.veiculo.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Veículo excluído com sucesso" })
  } catch (error) {
    console.error('Erro ao excluir veículo:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}