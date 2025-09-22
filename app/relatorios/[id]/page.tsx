"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, ArrowLeft, Download, DollarSign, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { DespesasDoRelatorio } from "@/components/relatorios/despesas-do-relatorio"
import { SaldoDisplay } from "@/components/ui/saldo-display"

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
  reembolsado: { label: "Reembolsado", variant: "default" as const }
}

export default function VisualizarRelatorio() {
  const params = useParams()
  const router = useRouter()
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [reembolsando, setReembolsando] = useState(false)
  const [extornando, setExtornando] = useState(false)
  const [showReembolsoModal, setShowReembolsoModal] = useState(false)
  const [showExtornoModal, setShowExtornoModal] = useState(false)

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

  const handleReembolsar = async () => {
    if (!relatorio) return

    const despesasNaoReembolsadas = relatorio.despesas?.filter(d => d.reembolsavel && !d.reembolsada) || []
    const quantidadeDespesas = despesasNaoReembolsadas.length

    if (quantidadeDespesas === 0) {
      toast.info('Nenhuma despesa para reembolsar', {
        description: 'Todas as despesas reembolsáveis deste relatório já foram marcadas como reembolsadas.'
      })
      return
    }

    setShowReembolsoModal(true)
  }

  const confirmReembolso = async () => {
    if (!relatorio) return

    setShowReembolsoModal(false)
    setReembolsando(true)
    
    try {
      const response = await fetch(`/api/relatorios/${id}/reembolsar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao reembolsar despesas')
      }

      const result = await response.json()
      
      toast.success('Despesas reembolsadas com sucesso!', {
        description: `${result.despesasReembolsadas} despesa(s) marcada(s) como reembolsada(s).`
      })

      // Recarregar dados
      loadRelatorio()
    } catch (error) {
      console.error('Erro ao reembolsar despesas:', error)
      toast.error('Erro ao reembolsar despesas', {
        description: error instanceof Error ? error.message : 'Erro interno do servidor'
      })
    } finally {
      setReembolsando(false)
    }
  }

  const handleExtornar = async () => {
    if (!relatorio) return

    const despesasReembolsadas = relatorio.despesas?.filter(d => d.reembolsavel && d.reembolsada) || []
    const quantidadeDespesas = despesasReembolsadas.length

    if (quantidadeDespesas === 0) {
      toast.info('Nenhuma despesa para extornar', {
        description: 'Não há despesas reembolsadas neste relatório para extornar.'
      })
      return
    }

    setShowExtornoModal(true)
  }

  const confirmExtorno = async () => {
    if (!relatorio) return

    setShowExtornoModal(false)
    setExtornando(true)
    
    try {
      const response = await fetch(`/api/relatorios/${id}/extornar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao extornar reembolso')
      }

      const result = await response.json()
      
      toast.success('Reembolso extornado com sucesso!', {
        description: `${result.despesasExtornadas} despesa(s) marcada(s) como não reembolsada(s).`
      })

      // Recarregar dados
      loadRelatorio()
    } catch (error) {
      console.error('Erro ao extornar reembolso:', error)
      toast.error('Erro ao extornar reembolso', {
        description: error instanceof Error ? error.message : 'Erro interno do servidor'
      })
    } finally {
      setExtornando(false)
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
            {relatorio.status === 'em_andamento' ? (
              <Button
                onClick={handleReembolsar}
                disabled={reembolsando}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {reembolsando ? 'Reembolsando...' : 'Reembolsar Relatório'}
              </Button>
            ) : (
              <Button
                onClick={handleExtornar}
                disabled={extornando}
                variant="default"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {extornando ? 'Extornando...' : 'Relatório Reembolsado'}
              </Button>
            )}
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
        />
      </div>

      {/* Modal de Confirmação de Reembolso */}
      <Dialog open={showReembolsoModal} onOpenChange={setShowReembolsoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Reembolsar Despesas
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <DialogDescription className="text-gray-600 mb-6">
            {(() => {
              const despesasNaoReembolsadas = relatorio?.despesas?.filter(d => d.reembolsavel && !d.reembolsada) || []
              const quantidadeDespesas = despesasNaoReembolsadas.length
              return (
                <>
                  <p className="mb-4">
                    Tem certeza que deseja marcar <strong className="text-gray-900">{quantidadeDespesas} despesa(s)</strong> deste relatório como reembolsadas?
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as despesas selecionadas serão marcadas como reembolsadas permanentemente.
                      </p>
                    </div>
                  </div>
                </>
              )
            })()}
          </DialogDescription>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowReembolsoModal(false)}
              disabled={reembolsando}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReembolso}
              disabled={reembolsando}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              {reembolsando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Reembolso
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Extorno */}
      <Dialog open={showExtornoModal} onOpenChange={setShowExtornoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Extornar Reembolso
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <DialogDescription className="text-gray-600 mb-6">
            {(() => {
              const despesasReembolsadas = relatorio?.despesas?.filter(d => d.reembolsavel && d.reembolsada) || []
              const quantidadeDespesas = despesasReembolsadas.length
              return (
                <>
                  <p className="mb-4">
                    Tem certeza que deseja extornar o reembolso de <strong className="text-gray-900">{quantidadeDespesas} despesa(s)</strong> deste relatório?
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">
                        <strong>Atenção:</strong> Esta ação irá reverter o reembolso e marcar todas as despesas como não reembolsadas. O status do relatório voltará para &quot;Em Andamento&quot;.
                      </p>
                    </div>
                  </div>
                </>
              )
            })()}
          </DialogDescription>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowExtornoModal(false)}
              disabled={extornando}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmExtorno}
              disabled={extornando}
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              {extornando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirmar Extorno
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}