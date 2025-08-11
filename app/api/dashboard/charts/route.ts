import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Obter data atual e dos últimos 6 meses
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // 1. Gráfico de Pizza - Despesas por Categoria (últimos 6 meses)
    const despesasPorCategoria = await prisma.despesa.groupBy({
      by: ['categoriaId'],
      _sum: {
        valor: true
      },
      _count: true,
      where: {
        dataDespesa: {
          gte: sixMonthsAgo
        }
      },
      orderBy: {
        _sum: {
          valor: 'desc'
        }
      }
    })

    // Buscar nomes das categorias
    const categorias = await prisma.categoria.findMany({
      where: {
        id: {
          in: despesasPorCategoria.map(item => item.categoriaId)
        }
      },
      select: {
        id: true,
        nome: true,
        cor: true
      }
    })

    const categoriasMap = new Map(categorias.map(cat => [cat.id, cat]))

    const pieChartData = despesasPorCategoria.map(item => ({
      name: categoriasMap.get(item.categoriaId)?.nome || 'Categoria',
      value: parseFloat(item._sum.valor?.toString() || '0'),
      count: item._count,
      color: categoriasMap.get(item.categoriaId)?.cor || '#8884d8'
    }))

    // 2. Gráfico de Barras - Evolução dos últimos 6 meses
    const monthlyExpenses = await Promise.all(
      Array.from({ length: 6 }, (_, index) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - (5 - index) + 1, 1)
        
        return prisma.despesa.aggregate({
          _sum: { valor: true },
          _count: true,
          where: {
            dataDespesa: {
              gte: monthDate,
              lt: nextMonth
            }
          }
        }).then(result => ({
          month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          monthFull: monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          valor: parseFloat(result._sum.valor?.toString() || '0'),
          quantidade: result._count,
          date: monthDate
        }))
      })
    )

    // 3. Gráfico de Linha - Tendência de Quilometragem (últimos 6 meses)
    const monthlyMileage = await Promise.all(
      Array.from({ length: 6 }, (_, index) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - (5 - index) + 1, 1)
        
        return prisma.despesaQuilometragem.aggregate({
          _sum: { 
            distanciaKm: true,
          },
          _count: true,
          where: {
            despesa: {
              dataDespesa: {
                gte: monthDate,
                lt: nextMonth
              }
            }
          }
        }).then(result => ({
          month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          monthFull: monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          quilometragem: parseFloat(result._sum.distanciaKm?.toString() || '0'),
          viagens: result._count,
          date: monthDate
        }))
      })
    )

    // Calcular valor da quilometragem para cada mês
    const monthlyMileageWithValues = await Promise.all(
      monthlyMileage.map(async (item) => {
        const nextMonth = new Date(item.date)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        
        const despesasQuilometragem = await prisma.despesaQuilometragem.findMany({
          where: {
            despesa: {
              dataDespesa: {
                gte: item.date,
                lt: nextMonth
              }
            }
          }
        })

        const valorTotal = despesasQuilometragem.reduce((acc, despesa) => {
          const valor = parseFloat(despesa.distanciaKm.toString()) * parseFloat(despesa.valorPorKm.toString())
          return acc + valor
        }, 0)

        return {
          ...item,
          valor: valorTotal
        }
      })
    )

    const chartData = {
      pieChart: {
        title: 'Despesas por Categoria',
        subtitle: 'Últimos 6 meses',
        data: pieChartData,
        total: pieChartData.reduce((acc, item) => acc + item.value, 0)
      },
      barChart: {
        title: 'Evolução das Despesas',
        subtitle: 'Últimos 6 meses',
        data: monthlyExpenses
      },
      lineChart: {
        title: 'Tendência de Quilometragem',
        subtitle: 'Últimos 6 meses',
        data: monthlyMileageWithValues
      }
    }

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}