import { AppLayout } from "@/components/layouts/app-layout"
import { NovaDespesaForm } from "@/components/forms/nova-despesa-form"
import { Suspense } from "react"

export default function NovaDespesa() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Despesas", href: "/despesas/todas" },
    { label: "Nova Despesa" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Nova Despesa</h1>
          <p className="text-muted-foreground">
            Registre uma nova despesa em um dos seus relatórios
          </p>
        </div>
        
        <Suspense fallback={<div>Carregando...</div>}>
          <NovaDespesaForm />
        </Suspense>
      </div>
    </AppLayout>
  )
}