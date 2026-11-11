"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, BellRing, CheckCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Notificacao {
  id: number
  tipo: string
  titulo: string
  mensagem: string
  relatorioId: number | null
  lidaEm: string | null
  createdAt: string
}

// Enquanto a aba está aberta e visível, confere novidades a cada 30 s
const INTERVALO_MS = 30_000

function quando(iso: string): string {
  const seg = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seg < 60) return "agora"
  const min = Math.round(seg / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  if (d < 7) return `há ${d} ${d === 1 ? "dia" : "dias"}`
  return new Date(iso).toLocaleDateString("pt-BR")
}

function suportaAvisoDoNavegador() {
  return typeof window !== "undefined" && "Notification" in window
}

export function Sininho() {
  const router = useRouter()
  const [naoLidas, setNaoLidas] = useState(0)
  const [itens, setItens] = useState<Notificacao[]>([])
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [permissao, setPermissao] = useState<NotificationPermission | "indisponivel">("indisponivel")
  // Id da notificação mais recente já vista; null até a primeira consulta (não avisa o que já existia)
  const ultimaVista = useRef<number | null>(null)
  const parado = useRef(false)

  useEffect(() => {
    if (suportaAvisoDoNavegador()) setPermissao(Notification.permission)
  }, [])

  const carregarLista = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch("/api/notificacoes?limite=20", { credentials: "include" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItens(data.notificacoes)
      setNaoLidas(data.naoLidas)
    } catch {
      toast.error("Não foi possível carregar as notificações")
    } finally {
      setCarregando(false)
    }
  }, [])

  // Avisa as notificações novas (toast na página; aviso do sistema se a aba estiver em segundo plano)
  const avisarNovas = useCallback(async (desde: number) => {
    const res = await fetch("/api/notificacoes?limite=10&naoLidas=true", { credentials: "include" })
    if (!res.ok) return
    const data = await res.json()
    const novas = (data.notificacoes as Notificacao[]).filter((n) => n.id > desde).reverse()
    for (const n of novas) {
      const abrir = () => n.relatorioId && router.push(`/relatorios/${n.relatorioId}`)
      if (document.hidden && suportaAvisoDoNavegador() && Notification.permission === "granted") {
        const aviso = new Notification(n.titulo, { body: n.mensagem, tag: `rdv-${n.id}` })
        aviso.onclick = () => {
          window.focus()
          abrir()
          aviso.close()
        }
      } else {
        toast(n.titulo, { description: n.mensagem, action: n.relatorioId ? { label: "Abrir", onClick: abrir } : undefined })
      }
    }
  }, [router])

  const conferir = useCallback(async () => {
    if (parado.current) return
    try {
      const res = await fetch("/api/notificacoes/contagem", { credentials: "include" })
      if (res.status === 401) {
        parado.current = true // sessão expirou: para de consultar
        return
      }
      if (!res.ok) return
      const { naoLidas, ultimaId } = (await res.json()) as { naoLidas: number; ultimaId: number | null }
      setNaoLidas(naoLidas)
      const anterior = ultimaVista.current
      ultimaVista.current = ultimaId ?? 0
      if (anterior !== null && ultimaId !== null && ultimaId > anterior) {
        await avisarNovas(anterior)
      }
    } catch {
      // sem rede: tenta de novo no próximo ciclo
    }
  }, [avisarNovas])

  useEffect(() => {
    conferir()
    const timer = setInterval(() => {
      if (!document.hidden || (suportaAvisoDoNavegador() && Notification.permission === "granted")) conferir()
    }, INTERVALO_MS)
    const aoVoltar = () => {
      if (!document.hidden) conferir()
    }
    document.addEventListener("visibilitychange", aoVoltar)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", aoVoltar)
    }
  }, [conferir])

  const aoAbrir = (abrir: boolean) => {
    setAberto(abrir)
    if (abrir) carregarLista()
  }

  const abrirNotificacao = async (n: Notificacao) => {
    setAberto(false)
    if (!n.lidaEm) {
      setItens((atual) => atual.map((x) => (x.id === n.id ? { ...x, lidaEm: new Date().toISOString() } : x)))
      setNaoLidas((q) => Math.max(q - 1, 0))
      fetch(`/api/notificacoes/${n.id}/lida`, { method: "POST", credentials: "include" }).catch(() => {})
    }
    if (n.relatorioId) router.push(`/relatorios/${n.relatorioId}`)
  }

  const marcarTodas = async () => {
    try {
      const res = await fetch("/api/notificacoes/lidas", { method: "POST", credentials: "include" })
      if (!res.ok) throw new Error()
      const agora = new Date().toISOString()
      setItens((atual) => atual.map((x) => ({ ...x, lidaEm: x.lidaEm ?? agora })))
      setNaoLidas(0)
    } catch {
      toast.error("Não foi possível marcar as notificações como lidas")
    }
  }

  const ativarAvisos = async () => {
    const resultado = await Notification.requestPermission()
    setPermissao(resultado)
    if (resultado === "granted") toast.success("Avisos do navegador ativados")
    else if (resultado === "denied") toast.error("Os avisos foram bloqueados. Libere nas configurações do site no navegador.")
  }

  return (
    <DropdownMenu open={aberto} onOpenChange={aoAbrir}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={naoLidas > 0 ? `${naoLidas} notificações não lidas` : "Notificações"}>
          {naoLidas > 0 ? <BellRing className="size-5" /> : <Bell className="size-5" />}
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
              {naoLidas > 99 ? "99+" : naoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={marcarTodas}>
              <CheckCheck className="size-3.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-96 overflow-y-auto">
          {carregando && itens.length === 0 ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : itens.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
          ) : (
            itens.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => abrirNotificacao(n)}
                className={cn(
                  "flex w-full gap-2 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  !n.lidaEm && "bg-primary/5"
                )}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.lidaEm ? "bg-transparent" : "bg-primary")} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", !n.lidaEm && "font-semibold")}>{n.titulo}</span>
                  <span className="block text-xs text-muted-foreground line-clamp-3">{n.mensagem}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{quando(n.createdAt)}</span>
                </span>
              </button>
            ))
          )}
        </div>

        {permissao === "default" && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <button
              type="button"
              onClick={ativarAvisos}
              className="w-full px-3 py-2 text-left text-xs text-primary hover:bg-accent"
            >
              Ativar avisos do navegador (mesmo com a aba em segundo plano)
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
