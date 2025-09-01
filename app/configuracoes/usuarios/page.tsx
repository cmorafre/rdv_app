"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Edit, Trash2, User } from "lucide-react"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Usuario {
  id: number
  nome: string
  email: string
  createdAt: string
  updatedAt: string
}

interface UsuariosResponse {
  usuarios: Usuario[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)
  const [deleting, setDeleting] = useState(false)

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Configurações", href: "/configuracoes" },
    { label: "Usuários" }
  ]

  const loadUsuarios = async (currentPage = 1, searchTerm = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20"
      })
      
      if (searchTerm.trim()) {
        params.append("busca", searchTerm)
      }

      const response = await fetch(`/api/usuarios?${params}`)
      
      if (!response.ok) {
        throw new Error("Erro ao carregar usuários")
      }

      const data: UsuariosResponse = await response.json()
      setUsuarios(data.usuarios)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setPage(currentPage)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast.error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsuarios(1, busca)
  }

  const handleDeleteUser = (usuario: Usuario) => {
    setUsuarioToDelete(usuario)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!usuarioToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/usuarios/${usuarioToDelete.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao excluir usuário")
        return
      }

      toast.success("Usuário excluído com sucesso!")
      loadUsuarios(page, busca) // Recarregar lista atual
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      toast.error("Erro ao excluir usuário")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setUsuarioToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os usuários do sistema
            </p>
          </div>
          <Button asChild>
            <Link href="/configuracoes/usuarios/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use os filtros abaixo para encontrar usuários específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              {busca && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBusca("")
                    loadUsuarios(1, "")
                  }}
                >
                  Limpar
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  {total} usuário{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Carregando usuários...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">Nenhum usuário encontrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {busca ? "Tente ajustar os filtros de busca." : "Comece criando um novo usuário."}
                </p>
                {!busca && (
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/configuracoes/usuarios/novo">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{usuario.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">{usuario.email}</span>
                          </TableCell>
                          <TableCell>{formatDate(usuario.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link href={`/configuracoes/usuarios/${usuario.id}/editar`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(usuario)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUsuarios(page - 1, busca)}
                        disabled={page <= 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUsuarios(page + 1, busca)}
                        disabled={page >= totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${usuarioToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </AppLayout>
  )
}