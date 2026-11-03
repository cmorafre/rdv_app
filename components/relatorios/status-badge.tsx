import { Badge } from "@/components/ui/badge"
import { infoStatus } from "@/lib/status-relatorio"
import { cn } from "@/lib/utils"

export function StatusRelatorioBadge({ status, className }: { status: string; className?: string }) {
  const info = infoStatus(status)
  return (
    <Badge variant="outline" className={cn(info.className, className)}>
      {info.label}
    </Badge>
  )
}
