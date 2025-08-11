"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { DespesasDoRelatorio } from "@/components/relatorios/despesas-do-relatorio"

interface Relatorio {
  id: number
  titulo: string
  dataInicio: string
  dataFim: string
  destino?: string
  proposito?: string
  status: string
  cliente?: string
  observacoes?: string
  valorTotal: number
  totalDespesas: number
  createdAt: string
  despesas: Array<{
    id: number
    descricao: string
    valor: number
    dataDespesa: string
    fornecedor?: string
    reembolsavel: boolean
    reembolsada: boolean
    clienteACobrar: boolean
    categoria: {
      id: number
      nome: string
      icone?: string
      cor?: string
    }
    createdAt: string
  }>
}

const statusMap = {
  em_andamento: { label: "Em Andamento", variant: "secondary" as const },
  finalizado: { label: "Finalizado", variant: "default" as const },
  reembolsado: { label: "Reembolsado", variant: "destructive" as const }
}

export default function VisualizarRelatorio() {
  const params = useParams()
  const router = useRouter()
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const id = params.id as string

  useEffect(() => {
    loadRelatorio()
  }, [id])

  const loadRelatorio = async () => {
    try {
      const response = await fetch(`/api/relatorios/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Relatório não encontrado")
          router.push("/relatorios/todos")
          return
        }
        throw new Error("Erro ao carregar relatório")
      }

      const data = await response.json()
      setRelatorio(data)
    } catch (error) {
      console.error("Erro ao carregar relatório:", error)
      toast.error("Erro ao carregar relatório")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const handleDownloadPdf = async () => {
    if (!relatorio) return

    setDownloadingPdf(true)
    try {
      // Buscar dados do relatório
      const response = await fetch(`/api/relatorios/${id}/pdf`)

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do relatório')
      }

      const { relatorio: relatorioData } = await response.json()

      // Importar dinamicamente o gerador de PDF
      const { generateRelatorioPDF } = await import('@/lib/pdf-generator')
      
      // Gerar PDF
      const pdfBytes = await generateRelatorioPDF(relatorioData)
      
      // Criar blob e download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${relatorio.titulo.replace(/[^a-zA-Z0-9]/g, '-')}-${formatDate(new Date().toISOString()).replace(/\//g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Todos os Relatórios", href: "/relatorios/todos" },
        { label: "Carregando..." }
      ]}>
        <div className="space-y-6">
          <div className="h-8 bg-muted/50 rounded-md animate-pulse" />
          <div className="h-64 bg-muted/50 rounded-md animate-pulse" />
        </div>
      </AppLayout>
    )
  }

  if (!relatorio) {
    return (
      <AppLayout breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Todos os Relatórios", href: "/relatorios/todos" },
        { label: "Relatório não encontrado" }
      ]}>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">Relatório não encontrado</h1>
          <Link href="/relatorios/todos">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Todos os Relatórios", href: "/relatorios/todos" },
    { label: relatorio.titulo }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{relatorio.titulo}</h1>
            <p className="text-muted-foreground">
              Criado em {formatDate(relatorio.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              variant="secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadingPdf ? 'Gerando PDF...' : 'Download PDF'}
            </Button>
            <Link href={`/relatorios/${relatorio.id}/editar`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Link href="/relatorios/todos">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Início</label>
                  <p className="font-medium">{formatDate(relatorio.dataInicio)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
                  <p className="font-medium">{formatDate(relatorio.dataFim)}</p>
                </div>
              </div>
              
              {relatorio.destino && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Destino</label>
                  <p className="font-medium">{relatorio.destino}</p>
                </div>
              )}
              
              {relatorio.proposito && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Propósito</label>
                  <p className="font-medium">{relatorio.proposito}</p>
                </div>
              )}
              
              {relatorio.cliente && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="font-medium">{relatorio.cliente}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={statusMap[relatorio.status as keyof typeof statusMap].variant}>
                    {statusMap[relatorio.status as keyof typeof statusMap].label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total de Despesas</label>
                  <p className="text-2xl font-bold">{relatorio.totalDespesas}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                  <p className="text-2xl font-bold">{formatCurrency(relatorio.valorTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {relatorio.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{relatorio.observacoes}</p>
            </CardContent>
          </Card>
        )}

        <DespesasDoRelatorio
          relatorioId={relatorio.id}
          despesas={relatorio.despesas}
          loading={loading}
          onUpdate={loadRelatorio}
        />
      </div>
    </AppLayout>
  )
}