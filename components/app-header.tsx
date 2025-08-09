"use client"

import * as React from "react"
import { Plane } from "lucide-react"

export function AppHeader() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Plane className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="font-semibold">RDV</span>
        <span className="text-xs">Despesas de Viagem</span>
      </div>
    </div>
  )
}