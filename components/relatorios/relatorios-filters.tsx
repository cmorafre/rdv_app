"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, X, Loader2 } from "lucide-react"

interface RelatoriosFilters {
  busca: string
  status: string
  dataInicio: string
  dataFim: string
  cliente: string
}

interface RelatoriosFiltersProps {
  onFilterChange: (filters: RelatoriosFilters) => void
  loading?: boolean
}

export function RelatoriosFilters({ onFilterChange, loading }: RelatoriosFiltersProps) {
  const [filters, setFilters] = useState({
    busca: "",
    status: "all",
    dataInicio: "",
    dataFim: "",
    cliente: ""
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isDebouncing, setIsDebouncing] = useState(false)

  // Debounce apenas para campos de texto
  useEffect(() => {
    setIsDebouncing(true)
    const timeoutId = setTimeout(() => {
      // Converter para API
      const apiFilters = { ...filters }
      if (apiFilters.status === "all") {
        apiFilters.status = ""
      }
      onFilterChange(apiFilters)
      setIsDebouncing(false)
    }, 500) // 500ms de delay para campos de texto

    return () => {
      clearTimeout(timeoutId)
      setIsDebouncing(false)
    }
  }, [filters.busca, filters.cliente])

  // Para outros campos (datas e status), aplicar imediatamente
  useEffect(() => {
    const apiFilters = { ...filters }
    if (apiFilters.status === "all") {
      apiFilters.status = ""
    }
    onFilterChange(apiFilters)
  }, [filters.status, filters.dataInicio, filters.dataFim])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    const clearedFilters = {
      busca: "",
      status: "all",
      dataInicio: "",
      dataFim: "",
      cliente: ""
    }
    setFilters(clearedFilters)
    // debouncedFilters será atualizado pelos useEffect
  }

  const hasActiveFilters = filters.busca !== "" || filters.status !== "all" || filters.dataInicio !== "" || filters.dataFim !== "" || filters.cliente !== ""
  
  // Mostrar loading apenas quando há texto e estamos fazendo debounce
  const showSearchLoading = isDebouncing && (filters.busca !== "" || filters.cliente !== "")

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {showAdvanced ? "Menos" : "Mais"} filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, destino ou cliente..."
                value={filters.busca}
                onChange={(e) => handleFilterChange("busca", e.target.value)}
                className="pl-10 pr-10"
                disabled={loading}
              />
              {showSearchLoading && filters.busca !== "" && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>
          <div className="w-48">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="reembolsado">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">Data início (a partir de)</label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => handleFilterChange("dataInicio", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data fim (até)</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => handleFilterChange("dataFim", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cliente</label>
              <div className="relative">
                <Input
                  placeholder="Nome do cliente"
                  value={filters.cliente}
                  onChange={(e) => handleFilterChange("cliente", e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                {showSearchLoading && filters.cliente !== "" && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}