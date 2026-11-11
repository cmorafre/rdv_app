import type { Prisma } from '@prisma/client'
import type { Sessao } from './auth'
import type { Acao } from './fluxo-relatorio'
import { prisma } from './db'
import { enviarEmail, escaparHtml, urlDoSite, type Email } from './email'

type Tx = Prisma.TransactionClient

export type TipoNotificacao = 'enviado' | 'aprovado' | 'reprovado' | 'reembolsado'

// O que foi gravado por uma ação: usado depois da transação para mandar e-mail (e, no futuro, push)
export interface Aviso {
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  relatorioId: number
  destinatarios: number[]
}

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
export async function notificarAcao(
  tx: Tx,
  acao: Acao,
  relatorio: RelatorioNotificado,
  sessao: Sessao,
  motivo?: string | null
): Promise<Aviso | null> {
  const tipo = TIPO_POR_ACAO[acao]
  if (!tipo) return null

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
  if (destinatarios.length === 0) return null

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
  return { tipo, titulo, mensagem, relatorioId: relatorio.id, destinatarios }
}

const CORES: Record<TipoNotificacao, string> = {
  enviado: '#2563eb',
  aprovado: '#16a34a',
  reprovado: '#dc2626',
  reembolsado: '#7c3aed',
}

export function montarEmail(aviso: Aviso, para: { email: string; nome: string }): Email {
  const link = `${urlDoSite()}/relatorios/${aviso.relatorioId}`
  const cor = CORES[aviso.tipo]
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden">
    <tr><td style="height:4px;background:${cor}"></td></tr>
    <tr><td style="padding:24px">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b">Olá, ${escaparHtml(para.nome)}</p>
      <h1 style="margin:0 0 12px;font-size:20px">${escaparHtml(aviso.titulo)}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5">${escaparHtml(aviso.mensagem)}</p>
      <a href="${link}" style="display:inline-block;padding:10px 18px;background:${cor};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold">Abrir relatório</a>
    </td></tr>
    <tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">
      RDV — Relatórios de Despesas de Viagem. Mensagem automática, não responda.
    </td></tr>
  </table>
</body>
</html>`
  const texto = `Olá, ${para.nome}\n\n${aviso.titulo}\n${aviso.mensagem}\n\nAbrir relatório: ${link}\n\n— RDV (mensagem automática, não responda)`
  return { para: para.email, assunto: `RDV: ${aviso.titulo}`, html, texto }
}

// Manda o aviso por e-mail aos destinatários ainda ativos. Roda depois da resposta (after),
// fora da transação: falha de e-mail não desfaz a ação
export async function enviarAvisoPorEmail(aviso: Aviso): Promise<number> {
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: aviso.destinatarios }, ativo: true },
    select: { email: true, nome: true },
  })
  const enviados = await Promise.all(usuarios.map((u) => enviarEmail(montarEmail(aviso, u))))
  return enviados.filter(Boolean).length
}
