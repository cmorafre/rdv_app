"use client"

import Link from "next/link"
import { Edit, ArrowLeft, Car, Truck, Bus, Bike, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  despesasQuilometragem?: {
    id: number
    quilometragem: number
    despesa: {
      id: number
      descricao: string
      valor: number
      dataDespesa: string
      relatorio: {
        id: number
        titulo: string
      }
    }
  }[]
}

interface VeiculoDetailsProps {
  veiculo: Veiculo
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

export function VeiculoDetails({ veiculo }: VeiculoDetailsProps) {
  const IconComponent = getVehicleIcon(veiculo.tipo)
  
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const formatDate = (date: string) => {
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return 'Data inválida'
      }
      return new Intl.DateTimeFormat('pt-BR').format(dateObj)
    } catch (error) {
      console.error('Erro ao formatar data:', date, error)
      return 'Data inválida'
    }
  }

  const totalQuilometragem = veiculo.despesasQuilometragem?.reduce((total, item) => total + item.quilometragem, 0) || 0
  const totalValor = veiculo.despesasQuilometragem?.reduce((total, item) => total + item.despesa.valor, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/veiculos/todos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <IconComponent className="h-6 w-6" />
              <span>{veiculo.tipo} - {veiculo.identificacao}</span>
            </h1>
            <p className="text-muted-foreground">
              {veiculo.marca || veiculo.modelo ? 
                `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim() : 
                'Detalhes do veículo'
              }
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/veiculos/${veiculo.id}/editar`}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="flex items-center space-x-2">
                  <IconComponent className="h-4 w-4" />
                  <span>{veiculo.tipo}</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Identificação</p>
                <p className="font-medium">{veiculo.identificacao}</p>
              </div>
            </div>

            {(veiculo.marca || veiculo.modelo) && (
              <div className="grid grid-cols-2 gap-4">
                {veiculo.marca && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Marca</p>
                    <p>{veiculo.marca}</p>
                  </div>
                )}
                {veiculo.modelo && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Modelo</p>
                    <p>{veiculo.modelo}</p>
                  </div>
                )}
              </div>
            )}

            {(veiculo.categoria || veiculo.combustivel) && (
              <div className="grid grid-cols-2 gap-4">
                {veiculo.categoria && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                    <p>{veiculo.categoria}</p>
                  </div>
                )}
                {veiculo.combustivel && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Combustível</p>
                    <p>{veiculo.combustivel}</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {veiculo.potencia && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Potência</p>
                  <p>{veiculo.potencia} CV</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor por Km</p>
                <p className="font-medium">{formatCurrency(veiculo.valorPorKm)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={veiculo.ativo ? "default" : "secondary"} className="mt-1">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de Uso</CardTitle>
            <CardDescription>
              Estatísticas baseadas nas últimas 10 despesas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quilometragem</p>
                <p className="text-2xl font-bold">{totalQuilometragem.toLocaleString('pt-BR')} km</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Valor</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValor)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Despesas Registradas</p>
              <p className="text-lg font-semibold">{veiculo.despesasQuilometragem?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {veiculo.despesasQuilometragem && veiculo.despesasQuilometragem.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas Despesas de Quilometragem</CardTitle>
            <CardDescription>
              Últimas 10 despesas associadas a este veículo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Quilometragem</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Relatório</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculo.despesasQuilometragem.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.despesa.dataDespesa)}</TableCell>
                      <TableCell>
                        <Link 
                          href={`/despesas/${item.despesa.id}`}
                          className="text-primary hover:underline"
                        >
                          {item.despesa.descricao}
                        </Link>
                      </TableCell>
                      <TableCell>{item.quilometragem.toLocaleString('pt-BR')} km</TableCell>
                      <TableCell>{formatCurrency(item.despesa.valor)}</TableCell>
                      <TableCell>
                        <Link 
                          href={`/relatorios/${item.despesa.relatorio.id}`}
                          className="text-primary hover:underline"
                        >
                          {item.despesa.relatorio.titulo}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium">Criado em</p>
              <p>{formatDate(veiculo.createdAt)}</p>
            </div>
            <div>
              <p className="font-medium">Última atualização</p>
              <p>{formatDate(veiculo.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}