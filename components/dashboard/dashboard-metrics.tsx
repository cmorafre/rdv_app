"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  DollarSign, 
  FileText, 
  Clock, 
  Car, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Plus,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { DashboardCharts } from "./dashboard-charts"

interface DashboardMetrics {
  totalDespesas: {
    valor: number
    quantidade: number
    variacao: number
    variacaoQuantidade: number
  }
  relatoriosAtivos: {
    quantidade: number
  }
  despesasPendentesReembolso: {
    valor: number
    quantidade: number
  }
  quilometragemTotal: {
    distancia: number
    valor: number
  }
  despesasRecentes: Array<{
    id: number
    descricao: string
    valor: number
    dataDespesa: string
    categoria: {
      nome: string
      icone?: string
      cor?: string
    }
    relatorio: {
      titulo: string
    }
  }>
  relatoriosRecentes: Array<{
    id: number
    titulo: string
    status: string
    updatedAt: string
  }>
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics')
        if (!response.ok) {
          throw new Error('Erro ao carregar métricas')
        }
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Erro ao carregar métricas:', error)
        toast.error('Erro ao carregar dados do dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getVariationColor = (variation: number) => {
    if (variation > 0) return "text-green-600"
    if (variation < 0) return "text-red-600"
    return "text-muted-foreground"
  }

  const getVariationIcon = (variation: number) => {
    if (variation > 0) return <TrendingUp className="h-4 w-4" />
    if (variation < 0) return <TrendingDown className="h-4 w-4" />
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Seções adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p>Erro ao carregar dados do dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com ações rápidas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas despesas e relatórios
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/despesas/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/relatorios/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards principais de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Despesas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Despesas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalDespesas.valor)}
            </div>
            <div className={`text-xs flex items-center ${getVariationColor(metrics.totalDespesas.variacao)}`}>
              {getVariationIcon(metrics.totalDespesas.variacao)}
              <span className="ml-1">
                {Math.abs(metrics.totalDespesas.variacao).toFixed(1)}% vs mês anterior
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalDespesas.quantidade} despesas este mês
            </p>
          </CardContent>
        </Card>

        {/* Relatórios Ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Relatórios Ativos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.relatoriosAtivos.quantidade}
            </div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>

        {/* Pendentes de Reembolso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendente Reembolso
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.despesasPendentesReembolso.valor)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.despesasPendentesReembolso.quantidade} despesas aguardando
            </p>
          </CardContent>
        </Card>

        {/* Quilometragem Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quilometragem
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.quilometragemTotal.distancia.toLocaleString('pt-BR')} km
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.quilometragemTotal.valor)} em despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Despesas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Últimas Despesas</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/despesas/todas">
                  Ver todas
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.despesasRecentes.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma despesa encontrada</p>
                </div>
              ) : (
                metrics.despesasRecentes.map((despesa) => (
                  <div key={despesa.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">{despesa.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {despesa.categoria.nome} • {formatDate(despesa.dataDespesa)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(despesa.valor)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Relatórios Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Relatórios Recentes</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/relatorios/todos">
                  Ver todos
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.relatoriosRecentes.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum relatório encontrado</p>
                </div>
              ) : (
                metrics.relatoriosRecentes.map((relatorio) => (
                  <div key={relatorio.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{relatorio.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        Atualizado em {formatDate(relatorio.updatedAt)}
                      </p>
                    </div>
                    <Badge variant={relatorio.status === 'em_andamento' ? 'default' : 'secondary'}>
                      {relatorio.status === 'em_andamento' ? 'Em Andamento' : 'Finalizado'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de gráficos */}
      <DashboardCharts />
    </div>
  )
}