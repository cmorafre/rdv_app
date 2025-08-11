import { AppLayout } from "@/components/layouts/app-layout"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"

export default function Home() {
  const breadcrumbs = [
    { label: "Dashboard" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <DashboardMetrics />
    </AppLayout>
  )
}
