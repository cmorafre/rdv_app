"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { DespesasList } from "@/components/despesas/despesas-list"
import { DespesasFilters } from "@/components/despesas/despesas-filters"
import { Plus } from "lucide-react"
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
  reembolsavel: boolean
  reembolsada: boolean
  clienteACobrar: boolean
  categoria: Categoria
  relatorio: Relatorio
  createdAt: string
}

interface FiltersState {
  busca: string
  categoriaId: string
  relatorioId: string
  dataInicio: string
  dataFim: string
  reembolsada: string
}

export default function TodasDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FiltersState>({
    busca: "",
    categoriaId: "all",
    relatorioId: "all",
    dataInicio: "",
    dataFim: "",
    reembolsada: "all"
  })

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Despesas", href: "/despesas/todas" },
    { label: "Todas as Despesas" }
  ]

  const loadDespesas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.busca) params.append('busca', filters.busca)
      if (filters.categoriaId && filters.categoriaId !== 'all') params.append('categoriaId', filters.categoriaId)
      if (filters.relatorioId && filters.relatorioId !== 'all') params.append('relatorioId', filters.relatorioId)
      if (filters.dataInicio) params.append('dataInicio', filters.dataInicio)
      if (filters.dataFim) params.append('dataFim', filters.dataFim)
      if (filters.reembolsada && filters.reembolsada !== 'all') params.append('reembolsada', filters.reembolsada)

      const response = await fetch(`/api/despesas?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Erro ao carregar despesas")
      }

      const data = await response.json()
      setDespesas(data.despesas || [])
    } catch (error) {
      console.error("Erro ao carregar despesas:", error)
      toast.error("Erro ao carregar despesas")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadDespesas()
  }, [loadDespesas])

  const handleFilterChange = useCallback((newFilters: FiltersState) => {
    setFilters(newFilters)
  }, [])

  const handleDelete = useCallback((deletedId: number) => {
    setDespesas(prev => prev.filter(d => d.id !== deletedId))
  }, [])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Todas as Despesas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as despesas registradas nos relatórios
            </p>
          </div>
          <Link href="/despesas/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </Link>
        </div>

        <DespesasFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />

        <DespesasList
          despesas={despesas}
          loading={loading}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  )
}