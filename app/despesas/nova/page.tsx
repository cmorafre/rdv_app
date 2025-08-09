import { AppLayout } from "@/components/layouts/app-layout"

export default function NovaDespesa() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Nova Despesa" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <h1 className="text-2xl font-bold">Nova Despesa</h1>
      <div className="bg-muted/50 flex-1 rounded-xl p-4">
        <p>Formulário de criação de despesa será implementado aqui.</p>
      </div>
    </AppLayout>
  )
}