import { AppLayout } from "@/components/layouts/app-layout"

export default function TodosRelatorios() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Todos os Relatórios" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <h1 className="text-2xl font-bold">Todos os Relatórios</h1>
      <div className="bg-muted/50 flex-1 rounded-xl p-4">
        <p>Lista de relatórios com filtros será implementada aqui.</p>
      </div>
    </AppLayout>
  )
}