// Testes de acesso entre contas e perfis: chama as rotas da API direto, com tokens
// de gestores e usuários de duas contas, e confere que nada vaza entre elas.
//
// APAGA TODAS AS TABELAS: só roda contra um Postgres local, nunca produção.
//   DATABASE_URL=postgresql://...@127.0.0.1:.../db npx prisma migrate deploy
//   DATABASE_URL=postgresql://...@127.0.0.1:.../db JWT_SECRET=qualquer npx tsx scripts/teste-acesso.ts
const urlBanco = process.env.DATABASE_URL ?? ''
if (!/^postgres(ql)?:\/\/[^@]*@(127\.0\.0\.1|localhost)[:/]/.test(urlBanco)) {
  console.error('Recusado: DATABASE_URL precisa apontar para um Postgres local (127.0.0.1 ou localhost).')
  process.exit(1)
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken } from '@/lib/auth'

const R = process.cwd() + '/app/api'
const rotas = {
  relatorios: () => import(`${R}/relatorios/route`),
  relatorio: () => import(`${R}/relatorios/[id]/route`),
  reembolsar: () => import(`${R}/relatorios/[id]/reembolsar/route`),
  extornar: () => import(`${R}/relatorios/[id]/extornar/route`),
  pdf: () => import(`${R}/relatorios/[id]/pdf/route`),
  despesas: () => import(`${R}/despesas/route`),
  despesa: () => import(`${R}/despesas/[id]/route`),
  veiculos: () => import(`${R}/veiculos/route`),
  veiculo: () => import(`${R}/veiculos/[id]/route`),
  usuarios: () => import(`${R}/usuarios/route`),
  usuario: () => import(`${R}/usuarios/[id]/route`),
  upload: () => import(`${R}/upload/route`),
  metrics: () => import(`${R}/dashboard/metrics/route`),
  charts: () => import(`${R}/dashboard/charts/route`),
  categorias: () => import(`${R}/categorias/route`),
  categoria: () => import(`${R}/categorias/[id]/route`),
  me: () => import(`${R}/auth/me/route`),
}

let falhas = 0
let total = 0
function confere(nome: string, ok: boolean, detalhe?: unknown) {
  total++
  if (ok) console.log(`  ok   ${nome}`)
  else { falhas++; console.log(`  FALHA ${nome}`, detalhe ?? '') }
}

type Rota = keyof typeof rotas
async function chama(rota: Rota, metodo: string, token: string | null, opts: { id?: number; query?: string; body?: unknown; form?: FormData } = {}) {
  const mod = await rotas[rota]()
  const url = `http://local/api/x${opts.query ? '?' + opts.query : ''}`
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (opts.form) body = opts.form
  else if (opts.body !== undefined) { body = JSON.stringify(opts.body); headers['Content-Type'] = 'application/json' }
  const req = new NextRequest(url, { method: metodo, headers, body })
  const ctx = { params: Promise.resolve({ id: String(opts.id ?? '') }) }
  const res: Response = await mod[metodo](req, ctx)
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

async function main() {
  // ---------- Dados ----------
  await prisma.$executeRawUnsafe('TRUNCATE comprovantes, despesas_quilometragem, despesas, relatorios, veiculos, usuarios, contas, categorias RESTART IDENTITY CASCADE')
  const contaA = await prisma.conta.create({ data: { nome: 'Empresa A', tipo: 'empresa' } })
  const contaB = await prisma.conta.create({ data: { nome: 'Empresa B', tipo: 'empresa' } })
  const u = (email: string, nome: string, contaId: number, perfil: string, ativo = true) =>
    prisma.usuario.create({ data: { email, nome, senha: 'x', contaId, perfil, ativo } })
  const gA = await u('ga@a', 'Gestor A', contaA.id, 'gestor')
  const uA = await u('ua@a', 'Usuário A', contaA.id, 'usuario')
  const u2A = await u('u2a@a', 'Usuário 2 A', contaA.id, 'usuario')
  const inA = await u('in@a', 'Inativo A', contaA.id, 'usuario', false)
  const gB = await u('gb@b', 'Gestor B', contaB.id, 'gestor')

  const alim = await prisma.categoria.create({ data: { nome: 'Alimentação' } })
  const km = await prisma.categoria.create({ data: { nome: 'Quilometragem' } })

  const v = (identificacao: string, dono: { id: number; contaId: number | null }) =>
    prisma.veiculo.create({ data: { tipo: 'pessoal', identificacao, valorPorKm: 1, contaId: dono.contaId, usuarioId: dono.id } })
  const vgA = await v('GA-0001', gA)
  const vuA = await v('UA-0001', uA)
  const vgB = await v('GB-0001', gB)

  const r = (titulo: string, dono: { id: number; contaId: number | null }) =>
    prisma.relatorio.create({ data: { titulo, dataInicio: new Date('2026-11-01'), dataFim: new Date('2026-11-30'), contaId: dono.contaId, usuarioId: dono.id } })
  const rgA = await r('Rel gestor A', gA)
  const ruA = await r('Rel usuário A', uA)
  const rgB = await r('Rel gestor B', gB)

  const d = (relatorioId: number, valor: number) =>
    prisma.despesa.create({ data: { relatorioId, categoriaId: alim.id, dataDespesa: new Date(), descricao: 'Almoço', valor } })
  const dgA = await d(rgA.id, 10)
  const duA = await d(ruA.id, 20)
  const dgB = await d(rgB.id, 40)
  const cB = await prisma.comprovante.create({ data: { despesaId: dgB.id, nomeArquivo: 'x', nomeOriginal: 'x.png', tamanho: 1, tipoMime: 'image/png', url: 'https://exemplo/x.png' } })

  const tk = async (x: { id: number; email: string; nome: string }) => generateToken({ userId: x.id, email: x.email, nome: x.nome })
  const T = { gA: await tk(gA), uA: await tk(uA), u2A: await tk(u2A), inA: await tk(inA), gB: await tk(gB) }

  // ---------- Autenticação ----------
  console.log('Autenticação')
  confere('sem token → 401', (await chama('relatorios', 'GET', null)).status === 401)
  confere('usuário inativo → 401', (await chama('relatorios', 'GET', T.inA)).status === 401)
  const me = await chama('me', 'GET', T.uA)
  confere('/me traz perfil e conta', me.json?.user?.perfil === 'usuario' && me.json?.user?.conta?.id === contaA.id, me.json)

  // ---------- Relatórios ----------
  console.log('Relatórios')
  const ids = (j: { relatorios: { id: number }[] }) => j.relatorios.map(x => x.id).sort()
  let res = await chama('relatorios', 'GET', T.uA)
  confere('usuário vê só os seus', JSON.stringify(ids(res.json)) === JSON.stringify([ruA.id]), ids(res.json))
  res = await chama('relatorios', 'GET', T.gA)
  confere('gestor vê a conta toda, sem outra conta', JSON.stringify(ids(res.json)) === JSON.stringify([rgA.id, ruA.id].sort()), ids(res.json))
  confere('total da paginação filtrado', res.json.total === 2, res.json.total)
  res = await chama('relatorios', 'GET', T.gB)
  confere('gestor B vê só B', JSON.stringify(ids(res.json)) === JSON.stringify([rgB.id]), ids(res.json))

  confere('gestor A abre relatório do usuário A', (await chama('relatorio', 'GET', T.gA, { id: ruA.id })).status === 200)
  confere('usuário A não abre relatório do gestor A → 404', (await chama('relatorio', 'GET', T.uA, { id: rgA.id })).status === 404)
  confere('gestor B não abre relatório de A → 404', (await chama('relatorio', 'GET', T.gB, { id: ruA.id })).status === 404)
  confere('PUT em relatório de outra conta → 404', (await chama('relatorio', 'PUT', T.gA, { id: rgB.id, body: { titulo: 'hack' } })).status === 404)
  confere('DELETE em relatório de outra conta → 404', (await chama('relatorio', 'DELETE', T.gA, { id: rgB.id })).status === 404)
  confere('reembolsar de outra conta → 404', (await chama('reembolsar', 'POST', T.gA, { id: rgB.id })).status === 404)
  confere('extornar de outra conta → 404', (await chama('extornar', 'POST', T.gA, { id: rgB.id })).status === 404)
  confere('PDF de outra conta → 404', (await chama('pdf', 'GET', T.gA, { id: rgB.id })).status === 404)
  res = await chama('pdf', 'GET', T.gA, { id: ruA.id })
  confere('PDF mostra o dono do relatório, não quem gerou', res.json?.relatorio?.usuario?.nome === 'Usuário A', res.json?.relatorio?.usuario)
  const rgBdepois = await prisma.relatorio.findUnique({ where: { id: rgB.id } })
  confere('relatório de B continua intacto', rgBdepois?.titulo === 'Rel gestor B' && rgBdepois.status === 'em_andamento')

  res = await chama('relatorios', 'POST', T.uA, { body: { titulo: 'Novo', dataInicio: '2026-11-01', dataFim: '2026-11-02' } })
  confere('relatório novo grava conta e dono', res.status === 201 && res.json.contaId === contaA.id && res.json.usuarioId === uA.id, res.json)

  // ---------- Despesas ----------
  console.log('Despesas')
  const dids = (j: { despesas: { id: number }[] }) => j.despesas.map(x => x.id).sort()
  res = await chama('despesas', 'GET', T.uA)
  confere('usuário vê só as suas despesas', JSON.stringify(dids(res.json)) === JSON.stringify([duA.id]), dids(res.json))
  res = await chama('despesas', 'GET', T.gA, { query: `relatorioId=${rgB.id}` })
  confere('filtro por relatorioId de outra conta volta vazio', res.json.total === 0, res.json.total)
  confere('GET despesa de outra conta → 404', (await chama('despesa', 'GET', T.gA, { id: dgB.id })).status === 404)
  confere('PUT despesa de outra conta → 404', (await chama('despesa', 'PUT', T.gA, { id: dgB.id, body: { valor: 1 } })).status === 404)
  confere('DELETE despesa de outra conta → 404', (await chama('despesa', 'DELETE', T.gA, { id: dgB.id })).status === 404)
  confere('usuário não edita despesa do gestor → 404', (await chama('despesa', 'PUT', T.uA, { id: dgA.id, body: { valor: 1 } })).status === 404)
  const base = { categoriaId: alim.id, dataDespesa: '2026-11-02', descricao: 'Táxi', valor: 5 }
  confere('POST em relatório de outra conta → 404', (await chama('despesas', 'POST', T.gA, { body: { ...base, relatorioId: rgB.id } })).status === 404)
  confere('usuário não lança em relatório do gestor → 404', (await chama('despesas', 'POST', T.uA, { body: { ...base, relatorioId: rgA.id } })).status === 404)

  const kmBase = { relatorioId: ruA.id, categoriaId: km.id, dataDespesa: '2026-11-02', descricao: 'Viagem', valor: 10, quilometragem: 10, origem: 'X', destino: 'Y' }
  confere('quilometragem com veículo de outro usuário → 404', (await chama('despesas', 'POST', T.uA, { body: { ...kmBase, veiculoId: vgA.id } })).status === 404)
  confere('quilometragem com veículo de outra conta → 404', (await chama('despesas', 'POST', T.uA, { body: { ...kmBase, veiculoId: vgB.id } })).status === 404)
  res = await chama('despesas', 'POST', T.uA, { body: { ...kmBase, veiculoId: vuA.id } })
  confere('quilometragem com veículo próprio → 201', res.status === 201, res.json)
  confere('gestor lançando no relatório do usuário com veículo do gestor → 404',
    (await chama('despesas', 'POST', T.gA, { body: { ...kmBase, veiculoId: vgA.id } })).status === 404)
  confere('PUT quilometragem trocando para veículo alheio → 404',
    (await chama('despesa', 'PUT', T.uA, { id: res.json.id, body: { veiculoId: vgA.id, quilometragem: 3, origem: 'X', destino: 'Y' } })).status === 404)

  // ---------- Comprovantes ----------
  console.log('Comprovantes')
  const form = new FormData()
  form.append('file', new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }))
  form.append('despesaId', String(dgB.id))
  confere('upload em despesa de outra conta → 404 (antes de enviar o arquivo)', (await chama('upload', 'POST', T.gA, { form })).status === 404)
  confere('excluir comprovante de outra conta → 404', (await chama('upload', 'DELETE', T.gA, { query: `id=${cB.id}` })).status === 404)
  confere('comprovante de B continua lá', !!(await prisma.comprovante.findUnique({ where: { id: cB.id } })))

  // ---------- Veículos ----------
  console.log('Veículos')
  const vids = (j: { veiculos: { id: number }[] }) => j.veiculos.map(x => x.id).sort()
  res = await chama('veiculos', 'GET', T.uA)
  confere('usuário vê só os seus veículos', JSON.stringify(vids(res.json)) === JSON.stringify([vuA.id]), vids(res.json))
  res = await chama('veiculos', 'GET', T.gA)
  confere('gestor vê os veículos da conta', JSON.stringify(vids(res.json)) === JSON.stringify([vgA.id, vuA.id].sort()), vids(res.json))
  confere('GET veículo de outra conta → 404', (await chama('veiculo', 'GET', T.gA, { id: vgB.id })).status === 404)
  confere('PUT veículo de outra conta → 404', (await chama('veiculo', 'PUT', T.gA, { id: vgB.id, body: { marca: 'x' } })).status === 404)
  confere('DELETE veículo de outra conta → 404', (await chama('veiculo', 'DELETE', T.gA, { id: vgB.id })).status === 404)
  res = await chama('veiculos', 'POST', T.uA, { body: { tipo: 'pessoal', identificacao: 'NOVO-1', valorPorKm: 1 } })
  confere('veículo novo grava conta e dono', res.status === 201 && res.json.contaId === contaA.id && res.json.usuarioId === uA.id, res.json)

  // ---------- Usuários ----------
  console.log('Usuários')
  res = await chama('usuarios', 'GET', T.gA)
  confere('lista só usuários da conta', res.json.usuarios.every((x: { email: string }) => x.email.endsWith('@a')) && res.json.total === 4, res.json.usuarios)
  confere('usuário comum não cria usuário → 403', (await chama('usuarios', 'POST', T.uA, { body: { nome: 'X', email: 'x@a.com', senha: '123456' } })).status === 403)
  res = await chama('usuarios', 'POST', T.gA, { body: { nome: 'Novo', email: 'novo@a.com', senha: '123456' } })
  const novo = await prisma.usuario.findUnique({ where: { email: 'novo@a.com' } })
  confere('gestor cria usuário na própria conta, perfil usuario', res.status === 201 && novo?.contaId === contaA.id && novo.perfil === 'usuario', res.json)
  confere('GET usuário de outra conta → 404', (await chama('usuario', 'GET', T.gA, { id: gB.id })).status === 404)
  confere('PUT usuário de outra conta → 404', (await chama('usuario', 'PUT', T.gA, { id: gB.id, body: { nome: 'x' } })).status === 404)
  confere('usuário comum não edita outro → 403', (await chama('usuario', 'PUT', T.uA, { id: u2A.id, body: { nome: 'x' } })).status === 403)
  confere('usuário edita o próprio nome → 200', (await chama('usuario', 'PUT', T.uA, { id: uA.id, body: { nome: 'Usuário A' } })).status === 200)
  confere('usuário não se promove a gestor → 403', (await chama('usuario', 'PUT', T.uA, { id: uA.id, body: { perfil: 'gestor' } })).status === 403)
  confere('gestor não se desativa → 400', (await chama('usuario', 'PUT', T.gA, { id: gA.id, body: { ativo: false } })).status === 400)
  confere('gestor desativa outro → 200', (await chama('usuario', 'PUT', T.gA, { id: u2A.id, body: { ativo: false } })).status === 200)
  confere('desativado perde acesso na hora → 401', (await chama('relatorios', 'GET', T.u2A)).status === 401)
  confere('usuário comum não exclui → 403', (await chama('usuario', 'DELETE', T.uA, { id: novo!.id })).status === 403)
  confere('gestor não exclui quem tem relatórios → 400', (await chama('usuario', 'DELETE', T.gA, { id: uA.id })).status === 400)
  confere('gestor não exclui a si mesmo → 400', (await chama('usuario', 'DELETE', T.gA, { id: gA.id })).status === 400)
  confere('gestor não exclui usuário de outra conta → 404', (await chama('usuario', 'DELETE', T.gA, { id: gB.id })).status === 404)
  confere('gestor exclui usuário sem dados → 200', (await chama('usuario', 'DELETE', T.gA, { id: novo!.id })).status === 200)

  // ---------- Dashboard ----------
  console.log('Dashboard')
  res = await chama('metrics', 'GET', T.uA)
  confere('métricas do usuário só com as suas despesas (20 + 10 km)', res.json.totalDespesas.valor === 30 && res.json.relatoriosAtivos.quantidade === 2, res.json.totalDespesas)
  confere('últimas despesas do usuário', res.json.despesasRecentes.every((x: { relatorioId: number }) => x.relatorioId === ruA.id), res.json.despesasRecentes.map((x: { relatorioId: number }) => x.relatorioId))
  confere('quilometragem do usuário', res.json.quilometragemTotal.distancia === 10, res.json.quilometragemTotal)
  res = await chama('metrics', 'GET', T.gB)
  confere('métricas do gestor B só com B', res.json.totalDespesas.valor === 40 && res.json.quilometragemTotal.distancia === 0, res.json.totalDespesas)
  res = await chama('charts', 'GET', T.gB)
  confere('gráficos do gestor B só com B', res.json.pieChart.total === 40, res.json.pieChart.total)
  res = await chama('charts', 'GET', T.uA)
  const kmUA = res.json.lineChart.data.reduce((a: number, x: { quilometragem: number }) => a + x.quilometragem, 0)
  confere('gráfico de km do usuário', kmUA === 10, kmUA)

  // ---------- Categorias ----------
  console.log('Categorias')
  confere('usuário comum lista categorias', (await chama('categorias', 'GET', T.uA)).status === 200)
  confere('usuário comum não cria categoria → 403', (await chama('categorias', 'POST', T.uA, { body: { nome: 'Nova' } })).status === 403)
  confere('usuário comum não edita categoria → 403', (await chama('categoria', 'PUT', T.uA, { id: alim.id, body: { nome: 'x' } })).status === 403)
  confere('usuário comum não exclui categoria → 403', (await chama('categoria', 'DELETE', T.uA, { id: alim.id })).status === 403)

  console.log(`\n${total - falhas}/${total} ok`)
  await prisma.$disconnect()
  process.exit(falhas ? 1 : 0)
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
