import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const DespesaUpdateSchema = z.object({
  categoriaId: z.number().int().positive("Categoria é obrigatória").optional(),
  dataDespesa: z.string().transform((val) => new Date(val)).optional(),
  descricao: z.string().min(1, "Descrição é obrigatória").max(255).optional(),
  fornecedor: z.string().optional().nullable(),
  valor: z.number().positive("Valor deve ser positivo").optional(),
  observacoes: z.string().optional().nullable(),
  reembolsavel: z.boolean().optional(),
  reembolsada: z.boolean().optional(),
  clienteACobrar: z.boolean().optional(),
  // Campos específicos para quilometragem
  veiculoId: z.number().int().positive().optional(),
  quilometragem: z.number().positive().optional(),
  origem: z.string().optional(),
  destino: z.string().optional(),
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

    const despesa = await prisma.despesa.findUnique({
      where: { id },
      include: {
        categoria: true,
        relatorio: {
          select: {
            id: true,
            titulo: true
          }
        },
        despesaQuilometragem: {
          include: {
            veiculo: true
          }
        },
        comprovantes: true
      }
    })

    if (!despesa) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(despesa)
  } catch (error) {
    console.error('Erro ao buscar despesa:', error)
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
    const validatedData = DespesaUpdateSchema.parse(body)

    // Verificar se a despesa existe
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id }
    })

    if (!existingDespesa) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se categoria é Quilometragem
    let isQuilometragem = false
    if (validatedData.categoriaId) {
      const categoria = await prisma.categoria.findUnique({
        where: { id: validatedData.categoriaId }
      })

      if (!categoria) {
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 }
        )
      }

      isQuilometragem = categoria.nome === "Quilometragem"
    } else {
      // Se não está mudando categoria, verificar a categoria atual
      const categoriaAtual = await prisma.categoria.findUnique({
        where: { id: existingDespesa.categoriaId }
      })
      isQuilometragem = categoriaAtual?.nome === "Quilometragem"
    }

    // Se for quilometragem, validar campos obrigatórios
    if (isQuilometragem) {
      if (validatedData.veiculoId !== undefined || validatedData.quilometragem !== undefined || 
          validatedData.origem !== undefined || validatedData.destino !== undefined) {
        
        // Se algum campo de quilometragem foi fornecido, verificar se todos estão presentes
        if (!validatedData.veiculoId || !validatedData.quilometragem || !validatedData.origem || !validatedData.destino) {
          return NextResponse.json(
            { error: "Para despesas de quilometragem, todos os campos são obrigatórios: veículo, quilometragem, origem e destino" },
            { status: 400 }
          )
        }

        // Verificar se o veículo existe
        const veiculo = await prisma.veiculo.findUnique({
          where: { id: validatedData.veiculoId }
        })

        if (!veiculo) {
          return NextResponse.json(
            { error: "Veículo não encontrado" },
            { status: 404 }
          )
        }

        if (!veiculo.ativo) {
          return NextResponse.json(
            { error: "Veículo não está ativo" },
            { status: 400 }
          )
        }
      }
    }

    // Atualizar usando transação
    const despesa = await prisma.$transaction(async (tx) => {
      // Separar dados de quilometragem dos dados principais da despesa
      const { veiculoId, quilometragem, origem, destino, ...dadosDespesa } = validatedData

      // Atualizar despesa principal
      const despesaAtualizada = await tx.despesa.update({
        where: { id },
        data: dadosDespesa,
        include: {
          categoria: true,
          relatorio: {
            select: {
              id: true,
              titulo: true
            }
          },
          despesaQuilometragem: {
            include: {
              veiculo: true
            }
          },
          comprovantes: true
        }
      })

      // Se for quilometragem e temos dados para atualizar
      if (isQuilometragem && veiculoId && quilometragem && origem && destino) {
        const veiculo = await tx.veiculo.findUnique({
          where: { id: veiculoId }
        })

        // Verificar se já existe registro de quilometragem
        const despesaQuilometragemExistente = await tx.despesaQuilometragem.findUnique({
          where: { despesaId: id }
        })

        if (despesaQuilometragemExistente) {
          // Atualizar registro existente
          await tx.despesaQuilometragem.update({
            where: { despesaId: id },
            data: {
              veiculoId,
              origem,
              destino,
              distanciaKm: quilometragem,
              valorPorKm: veiculo!.valorPorKm,
            }
          })
        } else {
          // Criar novo registro
          await tx.despesaQuilometragem.create({
            data: {
              despesaId: id,
              veiculoId,
              origem,
              destino,
              distanciaKm: quilometragem,
              valorPorKm: veiculo!.valorPorKm,
            }
          })
        }
      }

      return despesaAtualizada
    })

    return NextResponse.json(despesa)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar despesa:', error)
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

    // Verificar se a despesa existe
    const existingDespesa = await prisma.despesa.findUnique({
      where: { id }
    })

    if (!existingDespesa) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      )
    }

    await prisma.despesa.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Despesa excluída com sucesso" })
  } catch (error) {
    console.error('Erro ao excluir despesa:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}