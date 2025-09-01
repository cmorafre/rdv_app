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

    // Reembolsar todas as despesas do relatório que ainda não foram reembolsadas
    const result = await prisma.despesa.updateMany({
      where: {
        relatorioId: relatorioId,
        reembolsada: false,
        reembolsavel: true // só reembolsa despesas que são reembolsáveis
      },
      data: {
        reembolsada: true
      }
    })

    // Atualizar o status do relatório para "reembolsado"
    await prisma.relatorio.update({
      where: { id: relatorioId },
      data: { status: 'reembolsado' }
    })

    console.log(`✅ Reembolsadas ${result.count} despesas do relatório ${relatorioId}`)
    console.log(`✅ Status do relatório ${relatorioId} alterado para 'reembolsado'`)

    return NextResponse.json({
      message: 'Despesas reembolsadas com sucesso',
      despesasReembolsadas: result.count,
      relatorioId,
      novoStatus: 'reembolsado'
    })

  } catch (error) {
    console.error('❌ Erro ao reembolsar despesas do relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}