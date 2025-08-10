"use client"

import { AppLayout } from "@/components/layouts/app-layout"
import { NovaCategoriaForm } from "@/components/forms/nova-categoria-form"

export default function NovaCategoria() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Categorias", href: "/categorias/todas" },
    { label: "Nova Categoria" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Nova Categoria</h1>
        <NovaCategoriaForm />
      </div>
    </AppLayout>
  )
}