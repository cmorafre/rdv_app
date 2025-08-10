"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, Plus } from "lucide-react"
import { toast } from "sonner"
import { CategoriaIcon } from "@/components/categorias/categoria-icon"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Categoria {
  id: number
  nome: string
  icone?: string
  cor?: string
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
  createdAt: string
}

interface DespesasDoRelatorioProps {
  relatorioId: number
  despesas: Despesa[]
  loading?: boolean
  onUpdate?: () => void
}

export function DespesasDoRelatorio({ relatorioId, despesas, loading, onUpdate }: DespesasDoRelatorioProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [despesaToDelete, setDespesaToDelete] = useState<Despesa | null>(null)

  const handleDeleteClick = (despesa: Despesa) => {
    setDespesaToDelete(despesa)
  }

  const handleConfirmDelete = async () => {
    if (!despesaToDelete) return

    setDeletingId(despesaToDelete.id)
    try {
      const response = await fetch(`/api/despesas/${despesaToDelete.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir despesa")
      }

      toast.success("Despesa excluída com sucesso!")
      setDespesaToDelete(null)
      if (onUpdate) onUpdate()
    } catch (error: unknown) {
      console.error("Erro ao excluir despesa:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao excluir despesa")
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Despesas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (despesas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Despesas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Nenhuma despesa cadastrada neste relatório
              </p>
            </div>
            <Link href={`/despesas/nova?relatorio=${relatorioId}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Despesa
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma despesa encontrada</h3>
            <p className="mb-4">
              Adicione sua primeira despesa para começar a organizar os gastos deste relatório.
            </p>
            <Link href={`/despesas/nova?relatorio=${relatorioId}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Despesa
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Despesas ({despesas.length})</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(despesas.reduce((sum, d) => sum + d.valor, 0))}
              </p>
            </div>
            <Link href={`/despesas/nova?relatorio=${relatorioId}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {despesas.map((despesa) => (
                <TableRow key={despesa.id}>
                  <TableCell className="font-medium text-sm">
                    {formatDate(despesa.dataDespesa)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{despesa.descricao}</p>
                      {despesa.fornecedor && (
                        <p className="text-sm text-muted-foreground">{despesa.fornecedor}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CategoriaIcon 
                        iconName={despesa.categoria.icone}
                        color={despesa.categoria.cor}
                        size={16}
                      />
                      <span className="text-sm">{despesa.categoria.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(despesa.valor)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {despesa.reembolsada && (
                        <Badge variant="default" className="w-fit text-xs">
                          Reembolsada
                        </Badge>
                      )}
                      {!despesa.reembolsada && despesa.reembolsavel && (
                        <Badge variant="secondary" className="w-fit text-xs">
                          A Reembolsar
                        </Badge>
                      )}
                      {despesa.clienteACobrar && (
                        <Badge variant="outline" className="w-fit text-xs">
                          Cobrar Cliente
                        </Badge>
                      )}
                      {!despesa.reembolsavel && !despesa.clienteACobrar && (
                        <Badge variant="outline" className="w-fit text-xs">
                          Não Reembolsável
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={deletingId === despesa.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/despesas/${despesa.id}`}>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/despesas/${despesa.id}/editar`}>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(despesa)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!despesaToDelete}
        onOpenChange={(open) => !open && setDespesaToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Despesa"
        description={
          despesaToDelete 
            ? `Tem certeza que deseja excluir a despesa "${despesaToDelete.descricao}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={!!deletingId}
      />
    </>
  )
}