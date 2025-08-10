"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
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

interface FiltersState {
  busca: string
  categoriaId: string
  relatorioId: string
  dataInicio: string
  dataFim: string
  reembolsada: string
}

interface DespesasFiltersProps {
  filters: FiltersState
  onFilterChange: (filters: FiltersState) => void
  loading?: boolean
}

export function DespesasFilters({ filters, onFilterChange, loading }: DespesasFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FiltersState>({
    busca: filters.busca || "",
    categoriaId: filters.categoriaId || "all",
    relatorioId: filters.relatorioId || "all",
    dataInicio: filters.dataInicio || "",
    dataFim: filters.dataFim || "",
    reembolsada: filters.reembolsada || "all"
  })
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const debouncedBusca = useDebounce(localFilters.busca, 500)

  // Carregar dados para os filtros
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [categoriasRes, relatoriosRes] = await Promise.all([
          fetch("/api/categorias"),
          fetch("/api/relatorios")
        ])

        if (categoriasRes.ok) {
          const categoriasData = await categoriasRes.json()
          setCategorias(categoriasData)
        }

        if (relatoriosRes.ok) {
          const relatoriosData = await relatoriosRes.json()
          setRelatorios(relatoriosData.relatorios || [])
        }
      } catch (error) {
        console.error("Erro ao carregar dados para filtros:", error)
      } finally {
        setLoadingData(false)
      }
    }

    loadFilterData()
  }, [])

  // Callback para evitar infinite loops
  const handleFilterChange = useCallback((newFilters: FiltersState) => {
    onFilterChange(newFilters)
  }, [onFilterChange])

  // Aplicar busca com debounce
  useEffect(() => {
    if (debouncedBusca !== filters.busca) {
      const newFilters = { ...localFilters, busca: debouncedBusca }
      handleFilterChange(newFilters)
    }
  }, [debouncedBusca, filters.busca, localFilters, handleFilterChange])

  // Aplicar outros filtros imediatamente
  useEffect(() => {
    const filtersChanged = 
      localFilters.categoriaId !== filters.categoriaId ||
      localFilters.relatorioId !== filters.relatorioId ||
      localFilters.dataInicio !== filters.dataInicio ||
      localFilters.dataFim !== filters.dataFim ||
      localFilters.reembolsada !== filters.reembolsada

    if (filtersChanged) {
      handleFilterChange(localFilters)
    }
  }, [localFilters, filters, handleFilterChange])

  const updateFilter = (key: keyof FiltersState, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    const emptyFilters: FiltersState = {
      busca: "",
      categoriaId: "all",
      relatorioId: "all", 
      dataInicio: "",
      dataFim: "",
      reembolsada: "all"
    }
    setLocalFilters(emptyFilters)
    handleFilterChange(emptyFilters)
  }

  const hasActiveFilters = 
    localFilters.busca ||
    (localFilters.categoriaId && localFilters.categoriaId !== "all") ||
    (localFilters.relatorioId && localFilters.relatorioId !== "all") ||
    localFilters.dataInicio ||
    localFilters.dataFim ||
    (localFilters.reembolsada && localFilters.reembolsada !== "all")

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
          </div>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Busca */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por descrição ou fornecedor..."
                value={localFilters.busca}
                onChange={(e) => updateFilter("busca", e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Categoria */}
          <Select
            value={localFilters.categoriaId || "all"}
            onValueChange={(value) => updateFilter("categoriaId", value)}
            disabled={loading || loadingData}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                  <div className="flex items-center gap-2">
                    <CategoriaIcon 
                      iconName={categoria.icone}
                      color={categoria.cor}
                      size={14}
                    />
                    {categoria.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Relatório */}
          <Select
            value={localFilters.relatorioId || "all"}
            onValueChange={(value) => updateFilter("relatorioId", value)}
            disabled={loading || loadingData}
          >
            <SelectTrigger>
              <SelectValue placeholder="Relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os relatórios</SelectItem>
              {relatorios.map((relatorio) => (
                <SelectItem key={relatorio.id} value={relatorio.id.toString()}>
                  {relatorio.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status de Reembolso */}
          <Select
            value={localFilters.reembolsada || "all"}
            onValueChange={(value) => updateFilter("reembolsada", value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="true">Reembolsadas</SelectItem>
              <SelectItem value="false">Não reembolsadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Data inicial
            </label>
            <Input
              type="date"
              value={localFilters.dataInicio}
              onChange={(e) => updateFilter("dataInicio", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Data final
            </label>
            <Input
              type="date"
              value={localFilters.dataFim}
              onChange={(e) => updateFilter("dataFim", e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}