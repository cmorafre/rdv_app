"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { RelatoriosFilters } from "@/components/relatorios/relatorios-filters"
import { RelatoriosList } from "@/components/relatorios/relatorios-list"
import { RelatoriosPagination } from "@/components/relatorios/relatorios-pagination"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface Relatorio {
  id: number
  titulo: string
  dataInicio: string
  dataFim: string
  destino?: string
  status: string
  cliente?: string
  valorTotal: number
  createdAt: string
}

interface RelatoriosResponse {
  relatorios: Relatorio[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function TodosRelatorios() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState<Record<string, string>>({})

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Todos os Relatórios" }
  ]

  const loadRelatorios = useCallback(async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...filters
      })

      const response = await fetch(`/api/relatorios?${searchParams}`)
      
      if (!response.ok) {
        throw new Error("Erro ao carregar relatórios")
      }

      const data: RelatoriosResponse = await response.json()
      
      setRelatorios(data.relatorios)
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages
      })
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
      toast.error("Erro ao carregar relatórios")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, filters])

  useEffect(() => {
    loadRelatorios()
  }, [loadRelatorios])

  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filtering
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])

  const handleDelete = useCallback((deletedId: number) => {
    setRelatorios(prev => prev.filter(r => r.id !== deletedId))
    setPagination(prev => ({ ...prev, total: prev.total - 1 }))
  }, [])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Todos os Relatórios</h1>
          <Link href="/relatorios/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </Link>
        </div>

        <RelatoriosFilters
          onFilterChange={handleFilterChange}
          loading={loading}
        />

        <RelatoriosList
          relatorios={relatorios}
          loading={loading}
          onDelete={handleDelete}
        />

        {!loading && pagination.totalPages > 1 && (
          <RelatoriosPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        )}
      </div>
    </AppLayout>
  )
}