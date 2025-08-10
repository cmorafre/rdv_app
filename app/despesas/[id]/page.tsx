"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, ArrowLeft, Receipt } from "lucide-react"
import { toast } from "sonner"
import { CategoriaIcon } from "@/components/categorias/categoria-icon"

interface Categoria {
  id: number
  nome: string
  icone?: string
  cor?: string
}

interface Relatorio {
  id: number
  titulo: string
}

interface Despesa {
  id: number
  descricao: string
  valor: number
  dataDespesa: string
  fornecedor?: string
  observacoes?: string
  reembolsavel: boolean
  reembolsada: boolean
  clienteACobrar: boolean
  categoria: Categoria
  relatorio: Relatorio
  createdAt: string
}

export default function VisualizarDespesa() {
  const params = useParams()
  const router = useRouter()
  const [despesa, setDespesa] = useState<Despesa | null>(null)
  const [loading, setLoading] = useState(true)

  const id = params.id as string

  useEffect(() => {
    loadDespesa()
  }, [id])

  const loadDespesa = async () => {
    try {
      const response = await fetch(`/api/despesas/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Despesa não encontrada")
          router.push("/despesas/todas")
          return
        }
        throw new Error("Erro ao carregar despesa")
      }

      const data = await response.json()
      setDespesa(data)
    } catch (error) {
      console.error("Erro ao carregar despesa:", error)
      toast.error("Erro ao carregar despesa")
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

  if (loading) {
    return (
      <AppLayout breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Todas as Despesas", href: "/despesas/todas" },
        { label: "Carregando..." }
      ]}>
        <div className="space-y-6">
          <div className="h-8 bg-muted/50 rounded-md animate-pulse" />
          <div className="h-64 bg-muted/50 rounded-md animate-pulse" />
        </div>
      </AppLayout>
    )
  }

  if (!despesa) {
    return (
      <AppLayout breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Todas as Despesas", href: "/despesas/todas" },
        { label: "Despesa não encontrada" }
      ]}>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">Despesa não encontrada</h1>
          <Link href="/despesas/todas">
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
    { label: "Todas as Despesas", href: "/despesas/todas" },
    { label: despesa.descricao }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{despesa.descricao}</h1>
            <p className="text-muted-foreground">
              Criado em {formatDate(despesa.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/despesas/${despesa.id}/editar`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Link href="/despesas/todas">
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
              <CardTitle>Informações da Despesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data da Despesa</label>
                <p className="font-medium">{formatDate(despesa.dataDespesa)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                <div className="flex items-center gap-2 mt-1">
                  <CategoriaIcon 
                    iconName={despesa.categoria.icone}
                    color={despesa.categoria.cor}
                    size={18}
                  />
                  <span className="font-medium">{despesa.categoria.nome}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Relatório</label>
                <Link 
                  href={`/relatorios/${despesa.relatorio.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  {despesa.relatorio.titulo}
                </Link>
              </div>

              {despesa.fornecedor && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fornecedor</label>
                  <p className="font-medium">{despesa.fornecedor}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor</label>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(despesa.valor)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status e Reembolso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                {despesa.reembolsada && (
                  <Badge variant="default" className="w-fit">
                    <Receipt className="h-3 w-3 mr-1" />
                    Reembolsada
                  </Badge>
                )}
                {!despesa.reembolsada && despesa.reembolsavel && (
                  <Badge variant="secondary" className="w-fit">
                    <Receipt className="h-3 w-3 mr-1" />
                    A Reembolsar
                  </Badge>
                )}
                {despesa.clienteACobrar && (
                  <Badge variant="outline" className="w-fit">
                    Cobrar Cliente
                  </Badge>
                )}
                {!despesa.reembolsavel && !despesa.clienteACobrar && (
                  <Badge variant="outline" className="w-fit">
                    Não Reembolsável
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Reembolsável</span>
                  <Badge variant={despesa.reembolsavel ? "default" : "secondary"}>
                    {despesa.reembolsavel ? "Sim" : "Não"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Já Reembolsada</span>
                  <Badge variant={despesa.reembolsada ? "default" : "secondary"}>
                    {despesa.reembolsada ? "Sim" : "Não"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Cliente a Cobrar</span>
                  <Badge variant={despesa.clienteACobrar ? "default" : "secondary"}>
                    {despesa.clienteACobrar ? "Sim" : "Não"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {despesa.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{despesa.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}