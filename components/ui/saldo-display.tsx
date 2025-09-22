"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdiantamentoCalculator } from "@/lib/adiantamentos"
import { SaldoDisplayProps } from "@/lib/types"
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react"

export function SaldoDisplay({
  saldoRestante,
  valorReembolso,
  statusReembolso,
  size = "md",
  showReembolso = true
}: SaldoDisplayProps) {
  const saldoFormatado = AdiantamentoCalculator.formatarSaldo(saldoRestante)

  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  }

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  }

  const getSaldoIcon = () => {
    switch (saldoFormatado.status) {
      case 'positivo':
        return <TrendingUp className={cn("text-green-600", `w-${iconSize[size]} h-${iconSize[size]}`)} />
      case 'negativo':
        return <TrendingDown className={cn("text-red-600", `w-${iconSize[size]} h-${iconSize[size]}`)} />
      default:
        return <Minus className={cn("text-gray-600", `w-${iconSize[size]} h-${iconSize[size]}`)} />
    }
  }

  const getReembolsoInfo = () => {
    if (!showReembolso || !valorReembolso || statusReembolso === 'pendente') return null

    const calculo = AdiantamentoCalculator.calcularSaldo(0, valorReembolso)
    const reembolsoInfo = AdiantamentoCalculator.formatarReembolso(calculo)

    return (
      <div className="mt-2">
        <Badge variant={reembolsoInfo.cor === 'green' ? 'default' : reembolsoInfo.cor === 'red' ? 'destructive' : 'secondary'}>
          {reembolsoInfo.descricao}
        </Badge>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Saldo Disponível
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          {getSaldoIcon()}
          <span
            className={cn(
              "font-bold",
              sizeClasses[size],
              saldoFormatado.cor === 'green' && "text-green-600",
              saldoFormatado.cor === 'red' && "text-red-600",
              saldoFormatado.cor === 'gray' && "text-gray-600"
            )}
          >
            {saldoFormatado.valor}
          </span>
        </div>

        {saldoFormatado.status === 'positivo' && (
          <p className="text-xs text-muted-foreground mt-1">
            Saldo restante do adiantamento
          </p>
        )}

        {saldoFormatado.status === 'negativo' && (
          <p className="text-xs text-muted-foreground mt-1">
            Valor gasto além do adiantamento
          </p>
        )}

        {saldoFormatado.status === 'zero' && (
          <p className="text-xs text-muted-foreground mt-1">
            Adiantamento totalmente utilizado
          </p>
        )}

        {getReembolsoInfo()}
      </CardContent>
    </Card>
  )
}

// Componente compacto para usar em listas
export function SaldoCompact({ saldoRestante, size = "sm" }: { saldoRestante: number; size?: "sm" | "md" }) {
  const saldoFormatado = AdiantamentoCalculator.formatarSaldo(saldoRestante)

  const getSaldoIcon = () => {
    switch (saldoFormatado.status) {
      case 'positivo':
        return <TrendingUp className="w-3 h-3 text-green-600" />
      case 'negativo':
        return <TrendingDown className="w-3 h-3 text-red-600" />
      default:
        return <Minus className="w-3 h-3 text-gray-600" />
    }
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      {getSaldoIcon()}
      <span
        className={cn(
          "font-medium",
          size === "sm" ? "text-sm" : "text-base",
          saldoFormatado.cor === 'green' && "text-green-600",
          saldoFormatado.cor === 'red' && "text-red-600",
          saldoFormatado.cor === 'gray' && "text-gray-600"
        )}
      >
        {saldoFormatado.valor}
      </span>
    </div>
  )
}