"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Send, Undo2, CheckCircle, XCircle, DollarSign, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { AcoesRelatorio } from "@/lib/status-relatorio"

type AcaoComConfirmacao = 'enviar' | 'cancelarEnvio' | 'aprovar' | 'reembolsar' | 'extornar'

const CONFIRMACOES: Record<AcaoComConfirmacao, { rota: string; titulo: string; texto: string; botao: string; sucesso: string }> = {
  enviar: {
    rota: 'enviar',
    titulo: 'Enviar para aprovação',
    texto: 'Depois de enviado, o relatório e as despesas ficam travados até o gestor decidir. Você pode cancelar o envio enquanto ele não for analisado.',
    botao: 'Enviar',
    sucesso: 'Relatório enviado para aprovação',
  },
  cancelarEnvio: {
    rota: 'cancelar-envio',
    titulo: 'Cancelar envio',
    texto: 'O relatório volta para "Em andamento" e você poderá editá-lo de novo.',
    botao: 'Cancelar envio',
    sucesso: 'Envio cancelado',
  },
  aprovar: {
    rota: 'aprovar',
    titulo: 'Aprovar relatório',
    texto: 'O relatório fica aprovado e liberado para reembolso.',
    botao: 'Aprovar',
    sucesso: 'Relatório aprovado',
  },
  reembolsar: {
    rota: 'reembolsar',
    titulo: 'Registrar reembolso',
    texto: 'As despesas reembolsáveis serão marcadas como reembolsadas. Dá para desfazer com "Extornar".',
    botao: 'Reembolsar',
    sucesso: 'Reembolso registrado',
  },
  extornar: {
    rota: 'extornar',
    titulo: 'Extornar reembolso',
    texto: 'O relatório volta para "Aprovado" e as despesas deixam de constar como reembolsadas.',
    botao: 'Extornar',
    sucesso: 'Reembolso extornado',
  },
}

interface AcoesRelatorioProps {
  relatorioId: number
  acoes?: AcoesRelatorio
  onChange: () => void
}

// Botões do fluxo de aprovação. O backend decide o que a pessoa pode fazer (campo `acoes`)
export function AcoesRelatorioBotoes({ relatorioId, acoes, onChange }: AcoesRelatorioProps) {
  const [confirmando, setConfirmando] = useState<AcaoComConfirmacao | null>(null)
  const [reprovando, setReprovando] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [executando, setExecutando] = useState(false)

  if (!acoes) return null

  const executar = async (rota: string, sucesso: string, body?: unknown) => {
    setExecutando(true)
    try {
      const response = await fetch(`/api/relatorios/${relatorioId}/${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a ação')
      toast.success(sucesso)
      setConfirmando(null)
      setReprovando(false)
      setMotivo("")
      onChange()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a ação')
    } finally {
      setExecutando(false)
    }
  }

  const atual = confirmando ? CONFIRMACOES[confirmando] : null

  return (
    <>
      {acoes.enviar && (
        <Button onClick={() => setConfirmando('enviar')} className="bg-amber-600 hover:bg-amber-700">
          <Send className="h-4 w-4 mr-2" />
          Enviar para aprovação
        </Button>
      )}
      {acoes.cancelarEnvio && (
        <Button variant="outline" onClick={() => setConfirmando('cancelarEnvio')}>
          <Undo2 className="h-4 w-4 mr-2" />
          Cancelar envio
        </Button>
      )}
      {acoes.aprovar && (
        <Button onClick={() => setConfirmando('aprovar')} className="bg-blue-600 hover:bg-blue-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          Aprovar
        </Button>
      )}
      {acoes.reprovar && (
        <Button variant="destructive" onClick={() => setReprovando(true)}>
          <XCircle className="h-4 w-4 mr-2" />
          Reprovar
        </Button>
      )}
      {acoes.reembolsar && (
        <Button onClick={() => setConfirmando('reembolsar')} className="bg-green-600 hover:bg-green-700">
          <DollarSign className="h-4 w-4 mr-2" />
          Reembolsar
        </Button>
      )}
      {acoes.extornar && (
        <Button onClick={() => setConfirmando('extornar')} className="bg-orange-600 hover:bg-orange-700">
          <RotateCcw className="h-4 w-4 mr-2" />
          Extornar reembolso
        </Button>
      )}

      {atual && confirmando && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirmando(null)}
          onConfirm={() => executar(atual.rota, atual.sucesso)}
          title={atual.titulo}
          description={atual.texto}
          confirmText={atual.botao}
          loading={executando}
        />
      )}

      <Dialog open={reprovando} onOpenChange={(open) => !executando && setReprovando(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reprovar relatório</DialogTitle>
            <DialogDescription>
              O relatório volta para o responsável corrigir. Explique o que precisa ser ajustado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: falta o comprovante do almoço de 12/11"
            maxLength={1000}
            rows={4}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReprovando(false)} disabled={executando}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={executando || motivo.trim().length < 3}
              onClick={() => executar('reprovar', 'Relatório reprovado', { motivo: motivo.trim() })}
            >
              {executando ? 'Reprovando...' : 'Reprovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
