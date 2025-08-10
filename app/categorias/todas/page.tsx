"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { CategoriasList } from "@/components/categorias/categorias-list"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface Categoria {
  id: number
  nome: string
  icone?: string
  cor?: string
  ativa: boolean
  createdAt: string
}

export default function TodasCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Todas as Categorias" }
  ]

  const loadCategorias = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/categorias?includeInactive=true")
      
      if (!response.ok) {
        throw new Error("Erro ao carregar categorias")
      }

      const data: Categoria[] = await response.json()
      setCategorias(data)
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
      toast.error("Erro ao carregar categorias")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategorias()
  }, [loadCategorias])

  const handleDelete = useCallback((deletedId: number) => {
    setCategorias(prev => prev.filter(c => c.id !== deletedId))
  }, [])

  const handleUpdate = useCallback((updatedCategoria: Categoria) => {
    setCategorias(prev => prev.map(c => 
      c.id === updatedCategoria.id ? updatedCategoria : c
    ))
  }, [])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Todas as Categorias</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias de despesas do sistema
            </p>
          </div>
          <Link href="/categorias/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </Link>
        </div>

        <CategoriasList
          categorias={categorias}
          loading={loading}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      </div>
    </AppLayout>
  )
}