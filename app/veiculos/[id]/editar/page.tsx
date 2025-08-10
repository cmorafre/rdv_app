"use client"

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { AppLayout } from "@/components/layouts/app-layout"
import { EditVeiculoForm } from "@/components/forms/edit-veiculo-form"

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
}

export default function EditarVeiculo() {
  const params = useParams()
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const id = params?.id as string
  const veiculoId = parseInt(id)
  
  if (isNaN(veiculoId)) {
    notFound()
  }

  useEffect(() => {
    async function fetchVeiculo() {
      try {
        setLoading(true)
        const response = await fetch(`/api/veiculos/${veiculoId}`)
        
        if (!response.ok) {
          setError(true)
          return
        }
        
        const data = await response.json()
        setVeiculo(data)
      } catch (error) {
        console.error('Erro ao buscar veículo:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchVeiculo()
  }, [veiculoId])

  if (loading) {
    return (
      <AppLayout breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Veículos", href: "/veiculos" },
        { label: "Carregando..." }
      ]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando veículo...</div>
        </div>
      </AppLayout>
    )
  }

  if (error || !veiculo) {
    notFound()
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Veículos", href: "/veiculos" },
    { label: veiculo.identificacao, href: `/veiculos/${veiculo.id}` },
    { label: "Editar" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar Veículo</h1>
      </div>
      <div className="bg-muted/50 flex-1 rounded-xl p-6">
        <EditVeiculoForm veiculo={veiculo} />
      </div>
    </AppLayout>
  )
}