"use client"

import { useState } from "react"
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
import { MoreHorizontal, Edit, Trash2, Eye, Tag, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { EditCategoriaDialog } from "./edit-categoria-dialog"
import { CategoriaIcon } from "./categoria-icon"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Categoria {
  id: number
  nome: string
  icone?: string
  cor?: string
  ativa: boolean
  createdAt: string
}

interface CategoriasListProps {
  categorias: Categoria[]
  loading?: boolean
  onDelete: (id: number) => void
  onUpdate: (categoria: Categoria) => void
}

export function CategoriasList({ categorias, loading, onDelete, onUpdate }: CategoriasListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null)

  const handleDeleteClick = (categoria: Categoria) => {
    setCategoriaToDelete(categoria)
  }

  const handleConfirmDelete = async () => {
    if (!categoriaToDelete) return

    setDeletingId(categoriaToDelete.id)
    try {
      const response = await fetch(`/api/categorias/${categoriaToDelete.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir categoria")
      }

      toast.success("Categoria excluída com sucesso!")
      onDelete(categoriaToDelete.id)
      setCategoriaToDelete(null)
    } catch (error: unknown) {
      console.error("Erro ao excluir categoria:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao excluir categoria")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (categoria: Categoria) => {
    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ativa: !categoria.ativa
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar categoria")
      }

      const updatedCategoria = await response.json()
      toast.success(`Categoria ${updatedCategoria.ativa ? 'ativada' : 'desativada'} com sucesso!`)
      onUpdate(updatedCategoria)
    } catch (error: unknown) {
      console.error("Erro ao atualizar categoria:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar categoria")
    }
  }

  const formatDate = (date: string) => {
    if (!date) {
      return new Date().toLocaleDateString("pt-BR")
    }
    return new Date(date).toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (categorias.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-muted-foreground">
              Parece que não há categorias cadastradas no sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Categorias ({categorias.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <CategoriaIcon 
                        iconName={categoria.icone}
                        color={categoria.cor}
                        size={20}
                      />
                      <span>{categoria.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={categoria.ativa ? "default" : "secondary"}>
                      {categoria.ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(categoria.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={deletingId === categoria.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setEditingCategoria(categoria)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleActive(categoria)}
                        >
                          {categoria.ativa ? (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(categoria)}
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

      {editingCategoria && (
        <EditCategoriaDialog
          categoria={editingCategoria}
          open={!!editingCategoria}
          onOpenChange={(open) => !open && setEditingCategoria(null)}
          onUpdate={(updatedCategoria) => {
            onUpdate(updatedCategoria)
            setEditingCategoria(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!categoriaToDelete}
        onOpenChange={(open) => !open && setCategoriaToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Categoria"
        description={
          categoriaToDelete 
            ? `Tem certeza que deseja excluir a categoria "${categoriaToDelete.nome}"? Esta ação não pode ser desfeita e pode afetar despesas já cadastradas.`
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