"use client"

import { useState, useEffect } from "react"
import { ExpensePieChart } from "./expense-pie-chart"
import { ExpenseBarChart } from "./expense-bar-chart"
import { MileageLineChart } from "./mileage-line-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface ChartData {
  pieChart: {
    title: string
    subtitle: string
    data: Array<{
      name: string
      value: number
      count: number
      color: string
    }>
    total: number
  }
  barChart: {
    title: string
    subtitle: string
    data: Array<{
      month: string
      monthFull: string
      valor: number
      quantidade: number
      date: Date
    }>
  }
  lineChart: {
    title: string
    subtitle: string
    data: Array<{
      month: string
      monthFull: string
      quilometragem: number
      viagens: number
      valor: number
      date: Date
    }>
  }
}

export function DashboardCharts() {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const response = await fetch('/api/dashboard/charts')
        if (!response.ok) {
          throw new Error('Erro ao carregar dados dos gráficos')
        }
        const data = await response.json()
        setChartData(data)
      } catch (error) {
        console.error('Erro ao carregar dados dos gráficos:', error)
        toast.error('Erro ao carregar gráficos do dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadChartData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Análise Visual</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skeleton do gráfico de pizza */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          
          {/* Skeleton do gráfico de barras */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
        
        {/* Skeleton do gráfico de linha */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="text-center py-8">
        <p>Erro ao carregar dados dos gráficos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Análise Visual</h2>
        <p className="text-muted-foreground text-sm">
          Últimos 6 meses de atividade
        </p>
      </div>
      
      {/* Primeira linha: Gráfico de Pizza e Barras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensePieChart
          data={chartData.pieChart.data}
          title={chartData.pieChart.title}
          subtitle={chartData.pieChart.subtitle}
          total={chartData.pieChart.total}
        />
        
        <ExpenseBarChart
          data={chartData.barChart.data}
          title={chartData.barChart.title}
          subtitle={chartData.barChart.subtitle}
        />
      </div>
      
      {/* Segunda linha: Gráfico de Linha */}
      <div className="grid grid-cols-1 gap-6">
        <MileageLineChart
          data={chartData.lineChart.data}
          title={chartData.lineChart.title}
          subtitle={chartData.lineChart.subtitle}
        />
      </div>
    </div>
  )
}