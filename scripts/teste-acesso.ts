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
  enviar: () => import(`${R}/relatorios/[id]/enviar/route`),
  cancelarEnvio: () => import(`${R}/relatorios/[id]/cancelar-envio/route`),
  aprovar: () => import(`${R}/relatorios/[id]/aprovar/route`),
  reprovar: () => import(`${R}/relatorios/[id]/reprovar/route`),
  metrics: () => import(`${R}/dashboard/metrics/route`),
  charts: () => import(`${R}/dashboard/charts/route`),
  categorias: () => import(`${R}/categorias/route`),
  categoria: () => import(`${R}/categorias/[id]/route`),
  me: () => import(`${R}/auth/me/route`),
  notificacoes: () => import(`${R}/notificacoes/route`),
  contagem: () => import(`${R}/notificacoes/contagem/route`),
  lida: () => import(`${R}/notificacoes/[id]/lida/route`),
  lidas: () => import(`${R}/notificacoes/lidas/route`),
  dispositivos: () => import(`${R}/dispositivos/route`),
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
  await prisma.$executeRawUnsafe('TRUNCATE dispositivos, notificacoes, comprovantes, despesas_quilometragem, despesas, relatorios, veiculos, usuarios, contas, categorias RESTART IDENTITY CASCADE')
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

  const v = (identificacao: string, dono: { id: number; contaId: number }) =>
    prisma.veiculo.create({ data: { tipo: 'pessoal', identificacao, valorPorKm: 1, contaId: dono.contaId, usuarioId: dono.id } })
  const vgA = await v('GA-0001', gA)
  const vuA = await v('UA-0001', uA)
  const vgB = await v('GB-0001', gB)

  const r = (titulo: string, dono: { id: number; contaId: number }) =>
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
  res = await chama('veiculos', 'POST', T.gB, { body: { tipo: 'pessoal', identificacao: 'GA-0001', valorPorKm: 1 } })
  confere('mesma placa em outra conta → 201', res.status === 201, res.json)
  confere('placa repetida na mesma conta (outro usuário) → 400',
    (await chama('veiculos', 'POST', T.uA, { body: { tipo: 'pessoal', identificacao: 'GA-0001', valorPorKm: 1 } })).status === 400)
  confere('editar para placa já usada na conta → 400',
    (await chama('veiculo', 'PUT', T.uA, { id: vuA.id, body: { identificacao: 'GA-0001' } })).status === 400)
  confere('editar para placa usada só em outra conta → 200',
    (await chama('veiculo', 'PUT', T.gB, { id: vgB.id, body: { identificacao: 'UA-0001' } })).status === 200)

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

  // ---------- Fluxo de aprovação ----------
  console.log('Fluxo de aprovação')
  const st = async (id: number) => (await prisma.relatorio.findUnique({ where: { id } }))!
  await chama('relatorio', 'PUT', T.uA, { id: ruA.id, body: { status: 'reembolsado' } })
  confere('status não muda pelo formulário', (await st(ruA.id)).status === 'em_andamento')
  res = await chama('relatorios', 'POST', T.uA, { body: { titulo: 'Vazio', dataInicio: '2026-11-01', dataFim: '2026-11-02', status: 'aprovado' } })
  confere('relatório novo sempre nasce em andamento', res.json.status === 'em_andamento', res.json.status)
  res = await chama('enviar', 'POST', T.uA, { id: res.json.id })
  confere('enviar sem despesas → 400', res.status === 400, res.json)
  confere('gestor não envia relatório de outro → 403', (await chama('enviar', 'POST', T.gA, { id: ruA.id })).status === 403)
  res = await chama('enviar', 'POST', T.uA, { id: ruA.id })
  confere('dono envia → enviado', res.status === 200 && res.json.status === 'enviado' && !!res.json.enviadoEm && res.json.acoes.cancelarEnvio, res.json)
  confere('enviar de novo → 409', (await chama('enviar', 'POST', T.uA, { id: ruA.id })).status === 409)
  confere('editar relatório enviado → 409', (await chama('relatorio', 'PUT', T.uA, { id: ruA.id, body: { titulo: 'x' } })).status === 409)
  confere('excluir relatório enviado → 409', (await chama('relatorio', 'DELETE', T.uA, { id: ruA.id })).status === 409)
  confere('nova despesa em relatório enviado → 409', (await chama('despesas', 'POST', T.uA, { body: { ...base, relatorioId: ruA.id } })).status === 409)
  confere('editar despesa de relatório enviado → 409', (await chama('despesa', 'PUT', T.uA, { id: duA.id, body: { valor: 1 } })).status === 409)
  confere('excluir despesa de relatório enviado → 409', (await chama('despesa', 'DELETE', T.uA, { id: duA.id })).status === 409)
  const formEnv = new FormData()
  formEnv.append('file', new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }))
  formEnv.append('despesaId', String(duA.id))
  confere('comprovante em relatório enviado → 409', (await chama('upload', 'POST', T.uA, { form: formEnv })).status === 409)
  confere('usuário não aprova → 403', (await chama('aprovar', 'POST', T.uA, { id: ruA.id })).status === 403)
  confere('gestor de outra conta não aprova → 404', (await chama('aprovar', 'POST', T.gB, { id: ruA.id })).status === 404)
  res = await chama('relatorio', 'GET', T.gA, { id: ruA.id })
  confere('gestor vê ações de aprovar/reprovar e o nome do dono', res.json.acoes.aprovar && res.json.acoes.reprovar && !res.json.acoes.enviar && res.json.usuario?.nome === 'Usuário A', res.json.acoes)
  res = await chama('cancelarEnvio', 'POST', T.uA, { id: ruA.id })
  confere('dono cancela envio → em andamento', res.status === 200 && res.json.status === 'em_andamento' && res.json.enviadoEm === null, res.json)
  await chama('enviar', 'POST', T.uA, { id: ruA.id })
  confere('reprovar sem motivo → 400', (await chama('reprovar', 'POST', T.gA, { id: ruA.id, body: {} })).status === 400)
  res = await chama('reprovar', 'POST', T.gA, { id: ruA.id, body: { motivo: 'Falta o comprovante do almoço' } })
  confere('gestor reprova com motivo', res.status === 200 && res.json.status === 'reprovado' && res.json.motivoReprovacao === 'Falta o comprovante do almoço', res.json)
  res = await chama('relatorio', 'GET', T.uA, { id: ruA.id })
  confere('reprovado volta a ser editável pelo dono', res.json.acoes.editar && res.json.acoes.enviar, res.json.acoes)
  confere('dono corrige relatório reprovado → 200', (await chama('relatorio', 'PUT', T.uA, { id: ruA.id, body: { titulo: 'Rel usuário A (corrigido)' } })).status === 200)
  res = await chama('enviar', 'POST', T.uA, { id: ruA.id })
  confere('reenvio limpa o motivo', res.json.status === 'enviado' && res.json.motivoReprovacao === null, res.json)
  confere('reembolsar antes de aprovar → 409', (await chama('reembolsar', 'POST', T.gA, { id: ruA.id })).status === 409)
  res = await chama('aprovar', 'POST', T.gA, { id: ruA.id })
  confere('gestor aprova → aprovado, com quem aprovou', res.status === 200 && res.json.status === 'aprovado' && res.json.aprovadoPorId === gA.id && !!res.json.aprovadoEm, res.json)
  confere('aprovado não é editável → 409', (await chama('relatorio', 'PUT', T.uA, { id: ruA.id, body: { titulo: 'x' } })).status === 409)
  confere('usuário não reembolsa → 403', (await chama('reembolsar', 'POST', T.uA, { id: ruA.id })).status === 403)
  res = await chama('reembolsar', 'POST', T.gA, { id: ruA.id })
  const reembolsadas = await prisma.despesa.count({ where: { relatorioId: ruA.id, reembolsada: true } })
  const totalRuA = await prisma.despesa.count({ where: { relatorioId: ruA.id } })
  confere('gestor reembolsa → despesas marcadas', res.json.status === 'reembolsado' && reembolsadas === totalRuA && totalRuA > 0, { status: res.json.status, reembolsadas, totalRuA })
  confere('usuário não extorna → 403', (await chama('extornar', 'POST', T.uA, { id: ruA.id })).status === 403)
  res = await chama('extornar', 'POST', T.gA, { id: ruA.id })
  confere('extorno volta a aprovado e desmarca despesas', res.json.status === 'aprovado' && (await prisma.despesa.count({ where: { relatorioId: ruA.id, reembolsada: true } })) === 0, res.json.status)

  // Autoaprovação: só quando não há outro gestor
  console.log('Autoaprovação')
  await chama('enviar', 'POST', T.gA, { id: rgA.id })
  res = await chama('aprovar', 'POST', T.gA, { id: rgA.id })
  confere('único gestor aprova o próprio relatório', res.status === 200 && res.json.status === 'aprovado', res.json)
  const g2A = await u('g2a@a', 'Gestor 2 A', contaA.id, 'gestor')
  const T_g2A = await tk(g2A)
  const rg2 = await r('Rel 2 gestor A', gA)
  await d(rg2.id, 5)
  await chama('enviar', 'POST', T.gA, { id: rg2.id })
  res = await chama('relatorio', 'GET', T.gA, { id: rg2.id })
  confere('com outro gestor, botão de aprovar o próprio some', res.json.acoes.aprovar === false, res.json.acoes)
  confere('com outro gestor, aprovar o próprio → 403', (await chama('aprovar', 'POST', T.gA, { id: rg2.id })).status === 403)
  res = await chama('aprovar', 'POST', T_g2A, { id: rg2.id })
  confere('o outro gestor aprova', res.status === 200 && res.json.aprovadoPorId === g2A.id, res.json)
  res = await chama('relatorios', 'GET', T.gA, { query: 'status=enviado' })
  confere('filtro de pendentes funciona', res.json.relatorios.every((x: { status: string }) => x.status === 'enviado'), res.json.total)

  // ---------- Notificações ----------
  // Eventos acima: uA enviou 3x (gA avisado 3x; cancelar envio não avisa), gA reprovou/aprovou/reembolsou
  // (uA avisado 3x; extorno não avisa), gA enviou e aprovou o próprio sozinho (ninguém avisado),
  // gA enviou rg2 com g2A na conta (g2A avisado) e g2A aprovou (gA avisado)
  console.log('Notificações')
  const lista = async (token: string, query?: string) => (await chama('notificacoes', 'GET', token, { query })).json
  confere('sem token → 401', (await chama('notificacoes', 'GET', null)).status === 401)
  let n = await lista(T.gA)
  confere('gestor A: 3 envios do usuário + 1 aprovação do outro gestor', n.naoLidas === 4 && n.notificacoes.filter((x: { tipo: string }) => x.tipo === 'enviado').length === 3, n.notificacoes.map((x: { tipo: string }) => x.tipo))
  confere('nenhum aviso do próprio relatório que o gestor enviou e aprovou sozinho', n.notificacoes.every((x: { relatorioId: number }) => x.relatorioId !== rgA.id))
  confere('mais nova primeiro, com autor', n.notificacoes[0].tipo === 'aprovado' && n.notificacoes[0].autor?.id === g2A.id, n.notificacoes[0])
  n = await lista(T.uA)
  confere('dono: reembolsado, aprovado, reprovado (sem extorno nem cancelamento)', JSON.stringify(n.notificacoes.map((x: { tipo: string }) => x.tipo)) === '["reembolsado","aprovado","reprovado"]', n.notificacoes.map((x: { tipo: string }) => x.tipo))
  const reprov = n.notificacoes.find((x: { tipo: string }) => x.tipo === 'reprovado')
  confere('reprovação traz o motivo', reprov?.mensagem.includes('Falta o comprovante do almoço'), reprov?.mensagem)
  n = await lista(T_g2A)
  confere('segundo gestor avisado do envio do outro gestor', n.naoLidas === 1 && n.notificacoes[0].tipo === 'enviado' && n.notificacoes[0].relatorioId === rg2.id, n.notificacoes)
  confere('outra conta não recebe nada', (await lista(T.gB)).naoLidas === 0)
  const banco = await prisma.notificacao.findMany()
  confere('conta da notificação é a do relatório', banco.every(x => x.contaId === contaA.id), banco.map(x => x.contaId))

  n = await lista(T.gA, 'limite=2')
  confere('paginação: limite', n.notificacoes.length === 2 && n.temMais === true, n.notificacoes.length)
  const pag2 = await lista(T.gA, `limite=10&antesDe=${n.notificacoes[1].id}`)
  confere('paginação: antesDe', pag2.notificacoes.length === 2 && pag2.temMais === false && pag2.notificacoes.every((x: { id: number }) => x.id < n.notificacoes[1].id), pag2.notificacoes.length)

  res = await chama('contagem', 'GET', T.gA)
  confere('contagem: não lidas e id da mais recente', res.json.naoLidas === 4 && res.json.ultimaId === n.notificacoes[0].id, res.json)
  const deGA = n.notificacoes[0].id
  confere('marcar lida a de outro usuário → 404', (await chama('lida', 'POST', T.uA, { id: deGA })).status === 404)
  confere('marcar lida a de outra conta → 404', (await chama('lida', 'POST', T.gB, { id: deGA })).status === 404)
  res = await chama('lida', 'POST', T.gA, { id: deGA })
  confere('marcar lida → 200', res.status === 200 && !!res.json.lidaEm, res.json)
  const lidaEm1 = res.json.lidaEm
  res = await chama('lida', 'POST', T.gA, { id: deGA })
  confere('marcar de novo mantém a data', res.json.lidaEm === lidaEm1, res.json)
  confere('contador cai para 3', (await chama('contagem', 'GET', T.gA)).json.naoLidas === 3)
  confere('filtro só não lidas', (await lista(T.gA, 'naoLidas=true')).notificacoes.length === 3)
  res = await chama('lidas', 'POST', T.gA)
  confere('marcar todas como lidas', res.json.marcadas === 3 && (await chama('contagem', 'GET', T.gA)).json.naoLidas === 0, res.json)
  confere('marcar todas não mexe nas de outro usuário', (await chama('contagem', 'GET', T.uA)).json.naoLidas === 3)

  // ---------- Dispositivos (push) ----------
  console.log('Dispositivos')
  const tokA = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]'
  confere('registrar sem login → 401', (await chama('dispositivos', 'POST', null, { body: { token: tokA } })).status === 401)
  confere('token inválido → 400', (await chama('dispositivos', 'POST', T.uA, { body: { token: 'qualquer' } })).status === 400)
  confere('registra o celular', (await chama('dispositivos', 'POST', T.uA, { body: { token: tokA, plataforma: 'android' } })).status === 200)
  confere('registrar de novo não duplica', (await chama('dispositivos', 'POST', T.uA, { body: { token: tokA, plataforma: 'android' } })).status === 200 && (await prisma.dispositivo.count()) === 1)
  confere('celular fica com o usuário logado', (await prisma.dispositivo.findUnique({ where: { token: tokA } }))?.usuarioId === uA.id)
  res = await chama('dispositivos', 'DELETE', T.gB, { body: { token: tokA } })
  confere('outro usuário não remove o celular de ninguém', res.json.removidos === 0 && (await prisma.dispositivo.count()) === 1, res.json)
  await chama('dispositivos', 'POST', T.gA, { body: { token: tokA, plataforma: 'android' } })
  confere('troca de conta no mesmo celular passa o token para quem logou', (await prisma.dispositivo.findUnique({ where: { token: tokA } }))?.usuarioId === gA.id)
  res = await chama('dispositivos', 'DELETE', T.gA, { body: { token: tokA } })
  confere('sair da conta remove o celular', res.json.removidos === 1 && (await prisma.dispositivo.count()) === 0, res.json)

  console.log(`\n${total - falhas}/${total} ok`)
  await prisma.$disconnect()
  process.exit(falhas ? 1 : 0)
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
