import type { Prisma } from '@prisma/client'
import type { Sessao } from './auth'

// Filtros de acesso: o que cada sessão pode ver e alterar.
// Regra única: sempre a conta da sessão; o perfil "usuario" vê só o que é dele,
// o gestor vê tudo da conta. Registro fora do escopo responde 404 (não 403),
// para não revelar que o ID existe em outra conta.

function dono(sessao: Sessao) {
  return sessao.perfil === 'gestor'
    ? { contaId: sessao.contaId }
    : { contaId: sessao.contaId, usuarioId: sessao.userId }
}

export function escopoRelatorio(sessao: Sessao): Prisma.RelatorioWhereInput {
  return dono(sessao)
}

export function escopoVeiculo(sessao: Sessao): Prisma.VeiculoWhereInput {
  return dono(sessao)
}

// Despesas não têm dono próprio: herdam do relatório
export function escopoDespesa(sessao: Sessao): Prisma.DespesaWhereInput {
  return { relatorio: escopoRelatorio(sessao) }
}

// Usuários: todos da mesma conta (quem pode alterar é decidido na rota)
export function escopoUsuario(sessao: Sessao): Prisma.UsuarioWhereInput {
  return { contaId: sessao.contaId }
}

// Campos de dono gravados em todo registro novo
export function novoDono(sessao: Sessao) {
  return { contaId: sessao.contaId, usuarioId: sessao.userId }
}
