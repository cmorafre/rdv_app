"use client"

import { AppLayout } from "@/components/layouts/app-layout"
import { NovoRelatorioForm } from "@/components/forms/novo-relatorio-form"

export default function NovoRelatorio() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Novo Relatório" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Novo Relatório</h1>
        <NovoRelatorioForm />
      </div>
    </AppLayout>
  )
}