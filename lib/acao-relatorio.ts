import { NextRequest, NextResponse, after } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { requireAuth, type Sessao } from './auth'
import { escopoRelatorio } from './escopo'
import { acoesDoRelatorio, podeAprovarProprio, type Acao } from './fluxo-relatorio'
import { enviarAvisoPorEmail, notificarAcao, type Aviso } from './notificacoes'
import { emailAtivo } from './email'

type Tx = Prisma.TransactionClient
type Relatorio = Prisma.RelatorioGetPayload<object>

interface Definicao {
  acao: Acao
  // Status de onde a ação parte (para diferenciar "status errado" de "sem permissão")
  de: string[]
  // Validações extras antes de gravar; devolve mensagem de erro ou null
  validar?: (relatorio: Relatorio, body: Record<string, unknown>) => Promise<string | null> | string | null
  // O que gravar no relatório (o status novo vai aqui)
  dados: (relatorio: Relatorio, sessao: Sessao, body: Record<string, unknown>) => Prisma.RelatorioUncheckedUpdateManyInput
  // Efeitos extras na mesma transação (ex.: marcar despesas como reembolsadas)
  depois?: (tx: Tx, relatorio: Relatorio) => Promise<void>
}

const NOMES_STATUS: Record<string, string> = {
  em_andamento: 'em andamento',
  enviado: 'enviado',
  aprovado: 'aprovado',
  reprovado: 'reprovado',
  reembolsado: 'reembolsado',
}

export async function executarAcao(
  request: NextRequest,
  params: Promise<{ id: string }>,
  def: Definicao
): Promise<NextResponse> {
  try {
    const sessao = await requireAuth(request)
    if (sessao instanceof NextResponse) return sessao

    const id = parseInt((await params).id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    let body: Record<string, unknown> = {}
    try {
      body = (await request.json()) ?? {}
    } catch {
      // ações sem corpo
    }

    const relatorio = await prisma.relatorio.findFirst({ where: { id, ...escopoRelatorio(sessao) } })
    if (!relatorio) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })
    }

    if (!def.de.includes(relatorio.status)) {
      return NextResponse.json(
        { error: `Não é possível fazer isso com um relatório ${NOMES_STATUS[relatorio.status] ?? relatorio.status}.` },
        { status: 409 }
      )
    }

    const aprovaProprio = sessao.perfil === 'gestor' && (await podeAprovarProprio(sessao))
    if (!acoesDoRelatorio(relatorio, sessao, aprovaProprio)[def.acao]) {
      return NextResponse.json({ error: 'Você não tem permissão para fazer isso neste relatório.' }, { status: 403 })
    }

    const erro = def.validar ? await def.validar(relatorio, body) : null
    if (erro) {
      return NextResponse.json({ error: erro }, { status: 400 })
    }

    // Grava só se o status não mudou desde a leitura (duas pessoas agindo ao mesmo tempo)
    let aviso: Aviso | null = null
    const atualizado = await prisma.$transaction(async (tx) => {
      const { count } = await tx.relatorio.updateMany({
        where: { id, status: relatorio.status },
        data: def.dados(relatorio, sessao, body),
      })
      if (count === 0) return null
      if (def.depois) await def.depois(tx, relatorio)
      const novo = await tx.relatorio.findUnique({ where: { id } })
      if (novo) aviso = await notificarAcao(tx, def.acao, novo, sessao, novo.motivoReprovacao)
      return novo
    })

    if (!atualizado) {
      return NextResponse.json({ error: 'O relatório foi alterado por outra pessoa. Atualize a tela.' }, { status: 409 })
    }

    // E-mail depois da resposta, só com a transação já gravada
    const avisoGravado = aviso as Aviso | null
    if (avisoGravado && emailAtivo()) {
      after(() => enviarAvisoPorEmail(avisoGravado).catch((e) => console.error('Erro ao enviar e-mails do aviso:', e)))
    }

    return NextResponse.json({
      ...atualizado,
      acoes: acoesDoRelatorio(atualizado, sessao, aprovaProprio),
    })
  } catch (error) {
    console.error(`Erro na ação ${def.acao} do relatório:`, error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
