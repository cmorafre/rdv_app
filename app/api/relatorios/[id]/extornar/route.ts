import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const relatorioId = parseInt(id)

    if (!relatorioId || isNaN(relatorioId)) {
      return NextResponse.json(
        { error: 'ID do relatório inválido' },
        { status: 400 }
      )
    }

    // Verificar se o relatório existe
    const relatorio = await prisma.relatorio.findUnique({
      where: { id: relatorioId }
    })

    if (!relatorio) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      )
    }

    // Extornar reembolso: marcar todas as despesas reembolsadas como não reembolsadas
    const result = await prisma.despesa.updateMany({
      where: {
        relatorioId: relatorioId,
        reembolsada: true,
        reembolsavel: true // só extorna despesas que são reembolsáveis
      },
      data: {
        reembolsada: false
      }
    })

    // Atualizar o status do relatório para "em_andamento"
    await prisma.relatorio.update({
      where: { id: relatorioId },
      data: { status: 'em_andamento' }
    })

    console.log(`✅ Extornadas ${result.count} despesas do relatório ${relatorioId}`)
    console.log(`✅ Status do relatório ${relatorioId} alterado para 'em_andamento'`)

    return NextResponse.json({
      message: 'Reembolso extornado com sucesso',
      despesasExtornadas: result.count,
      relatorioId,
      novoStatus: 'em_andamento'
    })

  } catch (error) {
    console.error('❌ Erro ao extornar reembolso do relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}