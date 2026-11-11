import type { Prisma } from '@prisma/client'
import type { Sessao } from './auth'
import type { Acao } from './fluxo-relatorio'

type Tx = Prisma.TransactionClient

export type TipoNotificacao = 'enviado' | 'aprovado' | 'reprovado' | 'reembolsado'

interface RelatorioNotificado {
  id: number
  titulo: string
  contaId: number
  usuarioId: number
}

// Ações do fluxo que geram aviso. As demais (cancelar envio, extornar, editar) não avisam ninguém
const TIPO_POR_ACAO: Partial<Record<Acao, TipoNotificacao>> = {
  enviar: 'enviado',
  aprovar: 'aprovado',
  reprovar: 'reprovado',
  reembolsar: 'reembolsado',
}

function textos(tipo: TipoNotificacao, relatorio: RelatorioNotificado, autor: string, motivo?: string | null) {
  const titulo = `"${relatorio.titulo}"`
  switch (tipo) {
    case 'enviado':
      return { titulo: 'Relatório aguardando aprovação', mensagem: `${autor} enviou o relatório ${titulo} para aprovação.` }
    case 'aprovado':
      return { titulo: 'Relatório aprovado', mensagem: `${autor} aprovou o relatório ${titulo}.` }
    case 'reprovado':
      return {
        titulo: 'Relatório reprovado',
        mensagem: `${autor} reprovou o relatório ${titulo}.${motivo ? ` Motivo: ${motivo}` : ''}`,
      }
    case 'reembolsado':
      return { titulo: 'Relatório reembolsado', mensagem: `O reembolso do relatório ${titulo} foi registrado por ${autor}.` }
  }
}

// Grava as notificações de uma ação do fluxo, na mesma transação da ação.
//   enviado                         → gestores ativos da conta
//   aprovado/reprovado/reembolsado  → dono do relatório
// Quem fez a ação nunca é avisado da própria ação (ex.: gestor que envia e aprova o próprio relatório).
export async function notificarAcao(tx: Tx, acao: Acao, relatorio: RelatorioNotificado, sessao: Sessao, motivo?: string | null) {
  const tipo = TIPO_POR_ACAO[acao]
  if (!tipo) return

  let destinatarios: number[]
  if (tipo === 'enviado') {
    const gestores = await tx.usuario.findMany({
      where: { contaId: relatorio.contaId, perfil: 'gestor', ativo: true },
      select: { id: true },
    })
    destinatarios = gestores.map((g) => g.id)
  } else {
    destinatarios = [relatorio.usuarioId]
  }
  destinatarios = destinatarios.filter((id) => id !== sessao.userId)
  if (destinatarios.length === 0) return

  const { titulo, mensagem } = textos(tipo, relatorio, sessao.nome, motivo)
  await tx.notificacao.createMany({
    data: destinatarios.map((usuarioId) => ({
      contaId: relatorio.contaId,
      usuarioId,
      autorId: sessao.userId,
      relatorioId: relatorio.id,
      tipo,
      titulo,
      mensagem,
    })),
  })
}

