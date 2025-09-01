"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layouts/app-layout"
import { EditDespesaForm } from "@/components/forms/edit-despesa-form"
import { toast } from "sonner"

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

export default function EditarDespesa() {
  const params = useParams()
  const router = useRouter()
  const [despesa, setDespesa] = useState<Despesa | null>(null)
  const [loading, setLoading] = useState(true)

  const id = params.id as string

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadDespesa = useCallback(async () => {
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
      router.push("/despesas/todas")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDespesa()
  }, [loadDespesa])

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
    return null // Será redirecionado no useEffect
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Todas as Despesas", href: "/despesas/todas" },
    { label: despesa.descricao, href: `/despesas/${despesa.id}` },
    { label: "Editar" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Editar Despesa</h1>
          <p className="text-muted-foreground">
            Atualize as informações da despesa &quot;{despesa.descricao}&quot;
          </p>
        </div>
        
        <EditDespesaForm despesa={despesa} />
      </div>
    </AppLayout>
  )
}