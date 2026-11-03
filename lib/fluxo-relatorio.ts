import { prisma } from './db'
import type { Sessao } from './auth'

// Fluxo de aprovação do relatório:
//   em_andamento ──enviar──▶ enviado ──aprovar──▶ aprovado ──reembolsar──▶ reembolsado
//        ▲                     │  │                  ▲                         │
//        └──cancelar envio─────┘  └──reprovar──▶ reprovado                     │
//                                     (dono corrige e envia de novo)            │
//                                                    └─────────extornar────────┘
export const STATUS_RELATORIO = ['em_andamento', 'enviado', 'aprovado', 'reprovado', 'reembolsado'] as const
export type StatusRelatorio = (typeof STATUS_RELATORIO)[number]

// Só dá para mexer no relatório (dados, despesas, comprovantes) antes de enviar ou depois de reprovado
const EDITAVEIS: readonly string[] = ['em_andamento', 'reprovado']

export function relatorioEditavel(status: string): boolean {
  return EDITAVEIS.includes(status)
}

export const MSG_NAO_EDITAVEL =
  'Este relatório já foi enviado para aprovação e não pode ser alterado. Cancele o envio ou aguarde a reprovação para editar.'

export type Acao = 'editar' | 'enviar' | 'cancelarEnvio' | 'aprovar' | 'reprovar' | 'reembolsar' | 'extornar'
export type Acoes = Record<Acao, boolean>

interface RelatorioBase {
  status: string
  usuarioId: number
}

// O gestor só aprova o próprio relatório quando não há outro gestor para fazer isso
// (conta individual, ou único gestor ativo da empresa)
export async function podeAprovarProprio(sessao: Sessao): Promise<boolean> {
  const conta = await prisma.conta.findUnique({ where: { id: sessao.contaId }, select: { tipo: true } })
  if (conta?.tipo === 'individual') return true

  const gestores = await prisma.usuario.count({
    where: { contaId: sessao.contaId, perfil: 'gestor', ativo: true }
  })
  return gestores <= 1
}

// Ações disponíveis para a sessão neste relatório (o site e o app mostram só esses botões).
// `aprovaProprio` é o resultado de podeAprovarProprio, calculado uma vez por requisição.
export function acoesDoRelatorio(relatorio: RelatorioBase, sessao: Sessao, aprovaProprio: boolean): Acoes {
  const dono = relatorio.usuarioId === sessao.userId
  const gestor = sessao.perfil === 'gestor'
  const decide = gestor && (!dono || aprovaProprio)
  const s = relatorio.status

  return {
    editar: relatorioEditavel(s),
    enviar: dono && relatorioEditavel(s),
    cancelarEnvio: dono && s === 'enviado',
    aprovar: decide && s === 'enviado',
    reprovar: decide && s === 'enviado',
    reembolsar: gestor && s === 'aprovado',
    extornar: gestor && s === 'reembolsado',
  }
}
