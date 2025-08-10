"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Eye, Edit, Trash2, Car, Truck, Bus, Bike, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { VeiculosFilters } from "./veiculos-filters"

interface Veiculo {
  id: number
  tipo: string
  marca?: string
  modelo?: string
  categoria?: string
  combustivel?: string
  identificacao: string
  potencia?: number
  valorPorKm: number
  ativo: boolean
  createdAt: string
  updatedAt: string
}

interface VeiculosResponse {
  veiculos: Veiculo[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const getVehicleIcon = (tipo: string) => {
  switch (tipo.toLowerCase()) {
    case 'carro':
      return Car
    case 'moto':
      return Bike
    case 'caminhão':
    case 'van':
      return Truck
    case 'ônibus':
      return Bus
    default:
      return Car
  }
}

export function VeiculosList() {
  const [veiculos, setVeiculos] = useState<VeiculosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    busca: "",
    tipo: "all",
    ativo: "all"
  })
  const [page, setPage] = useState(1)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    veiculoId?: number
    loading?: boolean
  }>({
    open: false,
    loading: false
  })

  const loadVeiculos = useCallback(async () => {
    try {
      setLoading(true)
      
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: '10'
      })
      
      if (filters.busca) searchParams.set('busca', filters.busca)
      if (filters.tipo !== 'all') searchParams.set('tipo', filters.tipo)
      if (filters.ativo !== 'all') searchParams.set('ativo', filters.ativo)
      
      const response = await fetch(`/api/veiculos?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar veículos')
      }
      
      const data = await response.json()
      setVeiculos(data)
    } catch (error) {
      console.error('Erro ao carregar veículos:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.busca, filters.tipo, filters.ativo, page])

  useEffect(() => {
    loadVeiculos()
  }, [loadVeiculos])

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(1) // Reset para primeira página ao filtrar
  }, [])

  const handleDeleteClick = (veiculoId: number) => {
    setDeleteDialog({
      open: true,
      veiculoId,
      loading: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.veiculoId) return
    
    setDeleteDialog(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch(`/api/veiculos/${deleteDialog.veiculoId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Erro ao excluir veículo')
        return
      }
      
      // Recarregar lista
      await loadVeiculos()
      
      setDeleteDialog({ open: false, loading: false })
    } catch (error) {
      console.error('Erro ao excluir veículo:', error)
      alert('Erro ao excluir veículo')
    } finally {
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Filtros</h2>
          <p className="text-sm text-muted-foreground">
            {veiculos?.total || 0} veículo(s) encontrado(s)
          </p>
        </div>
        <Button asChild>
          <Link href="/veiculos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Veículo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <VeiculosFilters onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Veículos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!veiculos?.veiculos.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum veículo encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Identificação</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead>Potência</TableHead>
                    <TableHead>Valor/Km</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculos.veiculos.map((veiculo) => {
                    const IconComponent = getVehicleIcon(veiculo.tipo)
                    
                    return (
                      <TableRow key={veiculo.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span>{veiculo.tipo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{veiculo.identificacao}</TableCell>
                        <TableCell>
                          {veiculo.marca || veiculo.modelo ? 
                            `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim() : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>{veiculo.categoria || '-'}</TableCell>
                        <TableCell>{veiculo.combustivel || '-'}</TableCell>
                        <TableCell>
                          {veiculo.potencia ? `${veiculo.potencia} CV` : '-'}
                        </TableCell>
                        <TableCell>{formatCurrency(veiculo.valorPorKm)}</TableCell>
                        <TableCell>
                          <Badge variant={veiculo.ativo ? "default" : "secondary"}>
                            {veiculo.ativo ? (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Inativo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button asChild variant="ghost" size="sm" title="Visualizar veículo">
                              <Link href={`/veiculos/${veiculo.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm" title="Editar veículo">
                              <Link href={`/veiculos/${veiculo.id}/editar`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Excluir veículo"
                              onClick={() => handleDeleteClick(veiculo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {veiculos && veiculos.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {veiculos.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(veiculos.totalPages, p + 1))}
            disabled={page === veiculos.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDeleteConfirm}
        title="Excluir Veículo"
        description="Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleteDialog.loading}
      />
    </div>
  )
}