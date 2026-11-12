// Testes do push, sem enviar nada: o fetch do Expo Push é substituído.
// Usa o banco local (APAGA as tabelas, como o teste-acesso).
//   DATABASE_URL=postgresql://...@127.0.0.1:.../db npx tsx scripts/teste-push.ts
const urlBanco = process.env.DATABASE_URL ?? ''
if (!/^postgres(ql)?:\/\/[^@]*@(127\.0\.0\.1|localhost)[:/]/.test(urlBanco)) {
  console.error('Recusado: DATABASE_URL precisa apontar para um Postgres local (127.0.0.1 ou localhost).')
  process.exit(1)
}

import { prisma } from '@/lib/db'
import { enviarAvisoPorPush, tokenExpoValido } from '@/lib/push'
import type { Aviso } from '@/lib/notificacoes'

let falhas = 0
let total = 0
function confere(nome: string, ok: boolean, detalhe?: unknown) {
  total++
  if (ok) console.log(`  ok   ${nome}`)
  else { falhas++; console.log(`  FALHA ${nome}`, detalhe ?? '') }
}

type Msg = { to: string; title: string; body: string; data: { relatorioId: number } }
let chamadas: Msg[][] = []
let resposta: (msgs: Msg[]) => Response = (msgs) => Response.json({ data: msgs.map(() => ({ status: 'ok', id: 'x' })) })
globalThis.fetch = (async (_url: string, init: RequestInit) => {
  const msgs = JSON.parse(String(init.body)) as Msg[]
  chamadas.push(msgs)
  return resposta(msgs)
}) as typeof fetch

async function main() {
  console.log('Formato do token')
  confere('aceita ExponentPushToken[...]', tokenExpoValido('ExponentPushToken[abc123]'))
  confere('aceita ExpoPushToken[...]', tokenExpoValido('ExpoPushToken[abc123]'))
  confere('recusa outros formatos', !tokenExpoValido('abc') && !tokenExpoValido('ExponentPushToken[]') && !tokenExpoValido(123))

  await prisma.$executeRawUnsafe('TRUNCATE dispositivos, notificacoes, comprovantes, despesas_quilometragem, despesas, relatorios, veiculos, usuarios, contas, categorias RESTART IDENTITY CASCADE')
  const conta = await prisma.conta.create({ data: { nome: 'C', tipo: 'empresa' } })
  const u = (email: string, ativo = true) => prisma.usuario.create({ data: { email, nome: email, senha: 'x', contaId: conta.id, ativo } })
  const a = await u('a@x')
  const b = await u('b@x')
  const inativo = await u('i@x', false)
  const semCelular = await u('s@x')
  const dev = (token: string, usuarioId: number) => prisma.dispositivo.create({ data: { token, usuarioId, plataforma: 'android' } })
  await dev('ExponentPushToken[a1]', a.id)
  await dev('ExponentPushToken[a2]', a.id)
  await dev('ExponentPushToken[b1]', b.id)
  await dev('ExponentPushToken[i1]', inativo.id)

  const aviso = (destinatarios: number[]): Aviso => ({ tipo: 'aprovado', titulo: 'Relatório aprovado', mensagem: 'Fulano aprovou', relatorioId: 7, destinatarios })

  console.log('Envio')
  confere('sem celular cadastrado não chama o Expo', (await enviarAvisoPorPush(aviso([semCelular.id]))) === 0 && chamadas.length === 0)
  chamadas = []
  let n = await enviarAvisoPorPush(aviso([a.id, inativo.id]))
  const tos = chamadas.flat().map((m) => m.to).sort()
  confere('todos os celulares do destinatário, nenhum do inativo', n === 2 && JSON.stringify(tos) === '["ExponentPushToken[a1]","ExponentPushToken[a2]"]', tos)
  const m = chamadas[0]?.[0]
  confere('título, texto e relatório na mensagem', m?.title === 'Relatório aprovado' && m.body === 'Fulano aprovou' && m.data.relatorioId === 7, m)

  console.log('Falhas')
  resposta = (msgs) => Response.json({ data: msgs.map((x) => x.to === 'ExponentPushToken[a2]' ? { status: 'error', message: 'não registrado', details: { error: 'DeviceNotRegistered' } } : { status: 'ok' }) })
  n = await enviarAvisoPorPush(aviso([a.id]))
  confere('celular desinstalado é apagado', n === 1 && (await prisma.dispositivo.findUnique({ where: { token: 'ExponentPushToken[a2]' } })) === null && (await prisma.dispositivo.count({ where: { usuarioId: a.id } })) === 1)
  resposta = () => new Response('erro', { status: 500 })
  confere('Expo fora do ar → 0, sem lançar', (await enviarAvisoPorPush(aviso([b.id]))) === 0)
  resposta = () => { throw new Error('sem rede') }
  confere('sem rede → 0, sem lançar', (await enviarAvisoPorPush(aviso([b.id]))) === 0)
  confere('erro passageiro não apaga o celular', (await prisma.dispositivo.count({ where: { usuarioId: b.id } })) === 1)

  console.log(`\n${total - falhas}/${total} ok`)
  await prisma.$disconnect()
  process.exit(falhas ? 1 : 0)
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
