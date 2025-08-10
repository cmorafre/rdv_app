"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { MoreHorizontal, Edit, Trash2, Eye, FileText } from "lucide-react"
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

interface RelatoriosListProps {
  relatorios: Relatorio[]
  loading?: boolean
  onDelete: (id: number) => void
}

const statusMap = {
  em_andamento: { label: "Em Andamento", variant: "secondary" as const },
  finalizado: { label: "Finalizado", variant: "default" as const },
  reembolsado: { label: "Reembolsado", variant: "destructive" as const }
}

export function RelatoriosList({ relatorios, loading, onDelete }: RelatoriosListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este relatório?")) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/relatorios/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir relatório")
      }

      toast.success("Relatório excluído com sucesso!")
      onDelete(id)
    } catch (error) {
      console.error("Erro ao excluir relatório:", error)
      toast.error("Erro ao excluir relatório")
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (relatorios.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Não há relatórios que correspondam aos filtros aplicados.
            </p>
            <Link href="/relatorios/novo">
              <Button>Criar primeiro relatório</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relatorios.map((relatorio) => (
              <TableRow key={relatorio.id}>
                <TableCell className="font-medium">
                  <Link 
                    href={`/relatorios/${relatorio.id}`}
                    className="hover:underline"
                  >
                    {relatorio.titulo}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(relatorio.dataInicio)} - {formatDate(relatorio.dataFim)}
                </TableCell>
                <TableCell>
                  {relatorio.destino || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  {relatorio.cliente || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={statusMap[relatorio.status as keyof typeof statusMap].variant}>
                    {statusMap[relatorio.status as keyof typeof statusMap].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(relatorio.valorTotal)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={deletingId === relatorio.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/relatorios/${relatorio.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/relatorios/${relatorio.id}/editar`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(relatorio.id)}
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
  )
}