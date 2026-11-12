// Testes do e-mail de notificação, sem enviar nada: o fetch do Resend é substituído.
// Usa o banco local para conferir destinatários (APAGA as tabelas, como o teste-acesso).
//   DATABASE_URL=postgresql://...@127.0.0.1:.../db npx tsx scripts/teste-email.ts
const urlBanco = process.env.DATABASE_URL ?? ''
if (!/^postgres(ql)?:\/\/[^@]*@(127\.0\.0\.1|localhost)[:/]/.test(urlBanco)) {
  console.error('Recusado: DATABASE_URL precisa apontar para um Postgres local (127.0.0.1 ou localhost).')
  process.exit(1)
}

import { prisma } from '@/lib/db'
import { enviarEmail, emailAtivo } from '@/lib/email'
import { enviarAvisoPorEmail, montarEmail, type Aviso } from '@/lib/notificacoes'

let falhas = 0
let total = 0
function confere(nome: string, ok: boolean, detalhe?: unknown) {
  total++
  if (ok) console.log(`  ok   ${nome}`)
  else { falhas++; console.log(`  FALHA ${nome}`, detalhe ?? '') }
}

type Chamada = { url: string; headers: Record<string, string>; body: Record<string, unknown> }
let chamadas: Chamada[] = []
let resposta = () => new Response('{"id":"x"}', { status: 200 })
globalThis.fetch = (async (url: string, init: RequestInit) => {
  chamadas.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) })
  return resposta()
}) as typeof fetch

async function main() {
  const email = { para: 'a@b.c', assunto: 'x', html: '<p>x</p>', texto: 'x' }

  console.log('Sem chave')
  delete process.env.RESEND_API_KEY
  confere('desligado sem RESEND_API_KEY', !emailAtivo())
  confere('não chama o Resend', (await enviarEmail(email)) === false && chamadas.length === 0)

  console.log('Com chave')
  process.env.RESEND_API_KEY = 're_teste'
  delete process.env.EMAIL_REMETENTE
  confere('ligado com RESEND_API_KEY', emailAtivo())
  confere('aceito → true', (await enviarEmail(email)) === true)
  const c = chamadas[0]
  confere('chama a API do Resend com a chave', c?.url === 'https://api.resend.com/emails' && c.headers.Authorization === 'Bearer re_teste', c)
  confere('sem EMAIL_REMETENTE usa o remetente de teste', c?.body.from === 'RDV <onboarding@resend.dev>', c?.body.from)
  process.env.EMAIL_REMETENTE = 'RDV <nao-responda@notificacoes.sysdata.tech>'
  chamadas = []
  await enviarEmail(email)
  confere('usa EMAIL_REMETENTE', chamadas[0]?.body.from === 'RDV <nao-responda@notificacoes.sysdata.tech>')
  resposta = () => new Response('{"message":"domain not verified"}', { status: 403 })
  confere('recusado → false, sem lançar', (await enviarEmail(email)) === false)
  resposta = () => { throw new Error('sem rede') }
  confere('erro de rede → false, sem lançar', (await enviarEmail(email)) === false)
  resposta = () => new Response('{"id":"x"}', { status: 200 })

  console.log('Conteúdo')
  const aviso: Aviso = {
    tipo: 'reprovado',
    titulo: 'Relatório reprovado',
    mensagem: 'Gestor reprovou o relatório "<script>alert(1)</script>". Motivo: falta & sobra',
    relatorioId: 42,
    destinatarios: [],
  }
  process.env.APP_URL = 'https://exemplo.com/'
  const m = montarEmail(aviso, { email: 'd@x', nome: 'Ana <b>' })
  confere('assunto', m.assunto === 'RDV: Relatório reprovado', m.assunto)
  confere('HTML escapa o que o usuário digitou', !m.html.includes('<script>') && m.html.includes('&lt;script&gt;') && m.html.includes('falta &amp; sobra') && m.html.includes('Ana &lt;b&gt;'))
  confere('link para o relatório no site', m.html.includes('href="https://exemplo.com/relatorios/42"') && m.texto.includes('https://exemplo.com/relatorios/42'))
  confere('texto puro sem HTML escapado', m.texto.includes('<script>alert(1)</script>') && m.texto.includes('Olá, Ana <b>'))

  console.log('Destinatários')
  await prisma.$executeRawUnsafe('TRUNCATE dispositivos, notificacoes, comprovantes, despesas_quilometragem, despesas, relatorios, veiculos, usuarios, contas, categorias RESTART IDENTITY CASCADE')
  const conta = await prisma.conta.create({ data: { nome: 'C', tipo: 'empresa' } })
  const ativo = await prisma.usuario.create({ data: { email: 'ativo@x', nome: 'Ativo', senha: 'x', contaId: conta.id } })
  const inativo = await prisma.usuario.create({ data: { email: 'inativo@x', nome: 'Inativo', senha: 'x', contaId: conta.id, ativo: false } })
  chamadas = []
  const n = await enviarAvisoPorEmail({ ...aviso, destinatarios: [ativo.id, inativo.id] })
  confere('envia só para quem está ativo', n === 1 && chamadas.length === 1 && JSON.stringify(chamadas[0].body.to) === '["ativo@x"]', chamadas.map((x) => x.body.to))

  console.log(`\n${total - falhas}/${total} ok`)
  await prisma.$disconnect()
  process.exit(falhas ? 1 : 0)
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
