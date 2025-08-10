"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect, useState } from "react"

interface VeiculosFiltersProps {
  onFiltersChange: (filters: {
    busca: string
    tipo: string
    ativo: string
  }) => void
}

export function VeiculosFilters({ onFiltersChange }: VeiculosFiltersProps) {
  const [filters, setFilters] = useState({
    busca: "",
    tipo: "all",
    ativo: "all"
  })
  
  const debouncedBusca = useDebounce(filters.busca, 500)
  
  useEffect(() => {
    onFiltersChange({
      ...filters,
      busca: debouncedBusca
    })
  }, [debouncedBusca, filters.tipo, filters.ativo])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="busca">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="busca"
              placeholder="Buscar por tipo, marca, modelo ou identificação..."
              value={filters.busca}
              onChange={(e) => handleFilterChange("busca", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2 min-w-[180px]">
          <Label htmlFor="tipo">Tipo</Label>
          <Select
            value={filters.tipo}
            onValueChange={(value) => handleFilterChange("tipo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Carro">Carro</SelectItem>
              <SelectItem value="Moto">Moto</SelectItem>
              <SelectItem value="Caminhão">Caminhão</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Ônibus">Ônibus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 min-w-[140px]">
          <Label htmlFor="ativo">Status</Label>
          <Select
            value={filters.ativo}
            onValueChange={(value) => handleFilterChange("ativo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Ativo</SelectItem>
              <SelectItem value="false">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}