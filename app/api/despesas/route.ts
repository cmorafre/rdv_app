import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const DespesaCreateSchema = z.object({
  relatorioId: z.number().int().positive("Relatório é obrigatório"),
  categoriaId: z.number().int().positive("Categoria é obrigatória"), 
  dataDespesa: z.string().transform((val) => new Date(val)),
  descricao: z.string().min(1, "Descrição é obrigatória").max(255),
  fornecedor: z.string().optional().nullable(),
  valor: z.number().positive("Valor deve ser positivo"),
  observacoes: z.string().optional().nullable(),
  reembolsavel: z.boolean().default(true),
  reembolsada: z.boolean().default(false),
  clienteACobrar: z.boolean().default(false),
  // Campos específicos para quilometragem
  veiculoId: z.number().int().positive().optional(),
  quilometragem: z.number().positive().optional(),
  origem: z.string().optional(),
  destino: z.string().optional(),
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
    const categoriaId = searchParams.get('categoriaId')
    const relatorioId = searchParams.get('relatorioId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const reembolsada = searchParams.get('reembolsada')

    // Construir where clause
    const whereClause: Record<string, any> = {}

    if (busca) {
      whereClause.OR = [
        { descricao: { contains: busca, mode: 'insensitive' } },
        { fornecedor: { contains: busca, mode: 'insensitive' } }
      ]
    }

    if (categoriaId) {
      whereClause.categoriaId = parseInt(categoriaId)
    }

    if (relatorioId) {
      whereClause.relatorioId = parseInt(relatorioId)
    }

    if (dataInicio) {
      whereClause.dataDespesa = { gte: new Date(dataInicio) }
    }

    if (dataFim) {
      if (whereClause.dataDespesa) {
        whereClause.dataDespesa.lte = new Date(dataFim)
      } else {
        whereClause.dataDespesa = { lte: new Date(dataFim) }
      }
    }

    if (reembolsada) {
      whereClause.reembolsada = reembolsada === 'true'
    }

    // Contar total de registros
    const total = await prisma.despesa.count({ where: whereClause })

    // Buscar despesas com paginação
    const despesas = await prisma.despesa.findMany({
      where: whereClause,
      include: {
        categoria: true,
        relatorio: {
          select: {
            id: true,
            titulo: true
          }
        }
      },
      orderBy: {
        dataDespesa: 'desc'
      },
      skip,
      take: pageSize
    })

    return NextResponse.json({
      despesas,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Erro ao buscar despesas:', error)
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
    const validatedData = DespesaCreateSchema.parse(body)

    // Verificar se o relatório existe
    const relatorio = await prisma.relatorio.findUnique({
      where: { id: validatedData.relatorioId }
    })

    if (!relatorio) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se a categoria existe
    const categoria = await prisma.categoria.findUnique({
      where: { id: validatedData.categoriaId }
    })

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se é uma despesa de quilometragem
    const isQuilometragem = categoria.nome === "Quilometragem"
    
    if (isQuilometragem) {
      // Validar campos obrigatórios para quilometragem
      if (!validatedData.veiculoId || !validatedData.quilometragem || !validatedData.origem || !validatedData.destino) {
        return NextResponse.json(
          { error: "Veículo, quilometragem, origem e destino são obrigatórios para despesas de quilometragem" },
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

    // Criar a despesa usando uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar a despesa básica
      const despesa = await tx.despesa.create({
        data: {
          relatorioId: validatedData.relatorioId,
          categoriaId: validatedData.categoriaId,
          dataDespesa: validatedData.dataDespesa,
          descricao: validatedData.descricao,
          fornecedor: validatedData.fornecedor,
          valor: validatedData.valor,
          observacoes: validatedData.observacoes,
          reembolsavel: validatedData.reembolsavel,
          reembolsada: validatedData.reembolsada,
          clienteACobrar: validatedData.clienteACobrar,
        }
      })

      // Se for quilometragem, criar o registro específico
      if (isQuilometragem && validatedData.veiculoId && validatedData.quilometragem) {
        // Buscar o valor por km do veículo
        const veiculo = await tx.veiculo.findUnique({
          where: { id: validatedData.veiculoId }
        })
        
        await tx.despesaQuilometragem.create({
          data: {
            despesaId: despesa.id,
            veiculoId: validatedData.veiculoId,
            origem: validatedData.origem!,
            destino: validatedData.destino!,
            distanciaKm: validatedData.quilometragem,
            valorPorKm: veiculo!.valorPorKm,
          }
        })
      }

      return despesa
    })

    // Buscar a despesa completa com relações
    const despesaCompleta = await prisma.despesa.findUnique({
      where: { id: result.id },
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
        }
      }
    })

    return NextResponse.json(despesaCompleta, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar despesa:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}