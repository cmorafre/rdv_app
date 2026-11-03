"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, ArrowLeft, Download, XCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { DespesasDoRelatorio } from "@/components/relatorios/despesas-do-relatorio"
import { SaldoDisplay } from "@/components/ui/saldo-display"
import { StatusRelatorioBadge } from "@/components/relatorios/status-badge"
import { AcoesRelatorioBotoes } from "@/components/relatorios/acoes-relatorio"
import type { AcoesRelatorio } from "@/lib/status-relatorio"

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
  adiantamento?: number
  saldoRestante?: number
  valorReembolso?: number
  statusReembolso?: string
  tipoReembolso?: string
  createdAt: string
  enviadoEm?: string | null
  aprovadoEm?: string | null
  motivoReprovacao?: string | null
  usuario?: { id: number; nome: string }
  aprovadoPor?: { id: number; nome: string } | null
  acoes?: AcoesRelatorio
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

export default function VisualizarRelatorio() {
  const params = useParams()
  const router = useRouter()
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const id = params.id as string

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const formatCurrency = (value: number | string) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(numericValue)
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
              {relatorio.usuario && <> · Responsável: {relatorio.usuario.nome}</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <AcoesRelatorioBotoes relatorioId={relatorio.id} acoes={relatorio.acoes} onChange={loadRelatorio} />
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              variant="secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadingPdf ? 'Gerando PDF...' : 'Download PDF'}
            </Button>
            {relatorio.acoes?.editar !== false && (
              <Link href={`/relatorios/${relatorio.id}/editar`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            )}
            <Link href="/relatorios/todos">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        {relatorio.status === 'reprovado' && !!relatorio.motivoReprovacao && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                Reprovado{relatorio.aprovadoPor ? ` por ${relatorio.aprovadoPor.nome}` : ''}
              </p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{relatorio.motivoReprovacao}</p>
              {relatorio.acoes?.enviar && (
                <p className="text-sm mt-2">Corrija o que foi pedido e envie de novo.</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <StatusRelatorioBadge status={relatorio.status} />
                </div>
              </div>

              {!!relatorio.enviadoEm && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Enviado em</label>
                  <p className="font-medium">{formatDate(relatorio.enviadoEm)}</p>
                </div>
              )}

              {!!relatorio.aprovadoEm && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Aprovado</label>
                  <p className="font-medium">
                    {formatDate(relatorio.aprovadoEm)}
                    {relatorio.aprovadoPor && <> por {relatorio.aprovadoPor.nome}</>}
                  </p>
                </div>
              )}
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

              {relatorio.adiantamento && relatorio.adiantamento > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Adiantamento</label>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(relatorio.adiantamento)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {relatorio.adiantamento && relatorio.adiantamento > 0 && relatorio.saldoRestante !== undefined && (
            <div className="md:col-span-1">
              <SaldoDisplay
                saldoRestante={relatorio.saldoRestante}
                valorReembolso={relatorio.valorReembolso}
                statusReembolso={relatorio.statusReembolso || 'pendente'}
                size="lg"
                showReembolso={true}
              />
            </div>
          )}
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
          editavel={relatorio.acoes?.editar !== false}
        />
      </div>

    </AppLayout>
  )
}