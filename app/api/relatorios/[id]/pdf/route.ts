import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

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

    // Buscar o relatório com todas as suas despesas
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

    // Buscar dados do usuário atual (do authResult)
    const usuario = await prisma.usuario.findUnique({
      where: { id: authResult.userId },
      select: {
        nome: true,
        email: true
      }
    })

    if (!relatorio || !usuario) {
      return NextResponse.json(
        { error: "Relatório ou usuário não encontrado" },
        { status: 404 }
      )
    }

    // Retornar dados JSON para o cliente gerar o PDF
    const pdfData = {
      relatorio: {
        titulo: relatorio.titulo,
        dataInicio: relatorio.dataInicio,
        dataFim: relatorio.dataFim,
        status: relatorio.status,
        usuario: usuario,
        despesas: relatorio.despesas.map(despesa => ({
          ...despesa,
          categoria: despesa.categoria,
          despesaQuilometragem: despesa.despesaQuilometragem ? {
            ...despesa.despesaQuilometragem,
            veiculo: despesa.despesaQuilometragem.veiculo
          } : null
        }))
      }
    }

    return NextResponse.json(pdfData)

  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

function formatDate(dateString: string, withSlashes: boolean = true): string {
  const date = new Date(dateString)
  if (withSlashes) {
    return date.toLocaleDateString("pt-BR")
  } else {
    return date.toISOString().split('T')[0].replace(/-/g, '')
  }
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("pt-BR")
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value)
}