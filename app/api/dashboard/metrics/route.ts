import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { corsPreflightResponse, corsResponse } from '@/lib/cors'

export async function OPTIONS() {
  return corsPreflightResponse()
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Obter data atual e do mês anterior para comparação
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Buscar métricas em paralelo
    const [
      totalDespesasResult,
      totalDespesasAnteriorResult,
      relatoriosAtivos,
      despesasPendentesReembolso,
      quilometragemTotal,
      despesasRecentes,
      relatoriosRecentes
    ] = await Promise.all([
      // Total de despesas do mês atual
      prisma.despesa.aggregate({
        _sum: { valor: true },
        _count: true,
        where: {
          dataDespesa: {
            gte: currentMonth,
            lt: nextMonth
          }
        }
      }),

      // Total de despesas do mês anterior
      prisma.despesa.aggregate({
        _sum: { valor: true },
        _count: true,
        where: {
          dataDespesa: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      }),

      // Relatórios ativos (em andamento)
      prisma.relatorio.count({
        where: {
          status: 'em_andamento'
        }
      }),

      // Despesas pendentes de reembolso
      prisma.despesa.aggregate({
        _sum: { valor: true },
        _count: true,
        where: {
          reembolsavel: true,
          reembolsada: false
        }
      }),

      // Quilometragem total do mês atual
      prisma.despesaQuilometragem.aggregate({
        _sum: { 
          distanciaKm: true,
        },
        where: {
          despesa: {
            dataDespesa: {
              gte: currentMonth,
              lt: nextMonth
            }
          }
        }
      }),

      // Últimas 5 despesas
      prisma.despesa.findMany({
        take: 5,
        orderBy: {
          dataDespesa: 'desc'
        },
        include: {
          categoria: {
            select: {
              nome: true,
              icone: true,
              cor: true
            }
          },
          relatorio: {
            select: {
              titulo: true
            }
          }
        }
      }),

      // Últimos 5 relatórios
      prisma.relatorio.findMany({
        take: 5,
        orderBy: {
          updatedAt: 'desc'
        }
      })
    ])

    // Calcular valor total da quilometragem
    const despesasQuilometragem = await prisma.despesaQuilometragem.findMany({
      where: {
        despesa: {
          dataDespesa: {
            gte: currentMonth,
            lt: nextMonth
          }
        }
      }
    })

    const valorQuilometragem = despesasQuilometragem.reduce((acc, item) => {
      const valor = parseFloat(item.distanciaKm.toString()) * parseFloat(item.valorPorKm.toString())
      return acc + valor
    }, 0)

    // Calcular percentuais de variação
    const calcularVariacao = (atual: number, anterior: number) => {
      if (anterior === 0) return atual > 0 ? 100 : 0
      return ((atual - anterior) / anterior) * 100
    }

    const valorAtual = parseFloat(totalDespesasResult._sum.valor?.toString() || '0')
    const valorAnterior = parseFloat(totalDespesasAnteriorResult._sum.valor?.toString() || '0')
    const variacaoValor = calcularVariacao(valorAtual, valorAnterior)

    const quantidadeAtual = totalDespesasResult._count
    const quantidadeAnterior = totalDespesasAnteriorResult._count
    const variacaoQuantidade = calcularVariacao(quantidadeAtual, quantidadeAnterior)

    const metrics = {
      totalDespesas: {
        valor: valorAtual,
        quantidade: quantidadeAtual,
        variacao: variacaoValor,
        variacaoQuantidade: variacaoQuantidade
      },
      relatoriosAtivos: {
        quantidade: relatoriosAtivos
      },
      despesasPendentesReembolso: {
        valor: parseFloat(despesasPendentesReembolso._sum.valor?.toString() || '0'),
        quantidade: despesasPendentesReembolso._count
      },
      quilometragemTotal: {
        distancia: parseFloat(quilometragemTotal._sum.distanciaKm?.toString() || '0'),
        valor: valorQuilometragem
      },
      despesasRecentes,
      relatoriosRecentes
    }

    return corsResponse(metrics)
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error)
    return corsResponse(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}