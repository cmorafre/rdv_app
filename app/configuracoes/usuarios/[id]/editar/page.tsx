"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { EditUsuarioForm } from "@/components/forms/edit-usuario-form"
import { AppLayout } from "@/components/layouts/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Usuario {
  id: number
  nome: string
  email: string
  createdAt: string
  updatedAt: string
}

export default function EditarUsuarioPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const id = params.id as string

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Configurações", href: "/configuracoes" },
    { label: "Usuários", href: "/configuracoes/usuarios" },
    { label: "Editar Usuário" }
  ]

  useEffect(() => {
    const loadUsuario = async () => {
      try {
        const response = await fetch(`/api/usuarios/${id}`)
        
        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || "Erro ao carregar usuário")
          return
        }

        const data = await response.json()
        setUsuario(data)
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        toast.error("Erro ao carregar dados do usuário")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadUsuario()
    }
  }, [id])

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando usuário...</span>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  if (!usuario) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p>Usuário não encontrado.</p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <EditUsuarioForm usuario={usuario} />
    </AppLayout>
  )
}