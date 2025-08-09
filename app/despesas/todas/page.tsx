import { AppLayout } from "@/components/layouts/app-layout"

export default function TodasDespesas() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Todas as Despesas" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <h1 className="text-2xl font-bold">Todas as Despesas</h1>
      <div className="bg-muted/50 flex-1 rounded-xl p-4">
        <p>Lista de despesas com filtros será implementada aqui.</p>
      </div>
    </AppLayout>
  )
}