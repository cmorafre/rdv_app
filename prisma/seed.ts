import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário de teste
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  const testUser = await prisma.usuario.upsert({
    where: { email: 'teste@rdv.com' },
    update: {},
    create: {
      nome: 'Usuário Teste',
      email: 'teste@rdv.com',
      senha: hashedPassword,
    },
  })

  console.log('✅ Usuário de teste criado:', testUser.email)
  console.log('📧 Email: teste@rdv.com')
  console.log('🔑 Senha: 123456')

  // Criar categorias de despesas predefinidas
  const categorias = [
    { nome: 'Aluguel de carro', icone: 'car', cor: '#3b82f6' },
    { nome: 'Avião', icone: 'plane', cor: '#06b6d4' },
    { nome: 'Combustível', icone: 'fuel', cor: '#f59e0b' },
    { nome: 'Diversos', icone: 'more-horizontal', cor: '#6b7280' },
    { nome: 'Estacionamento', icone: 'parking-circle', cor: '#8b5cf6' },
    { nome: 'Hotel', icone: 'bed', cor: '#ec4899' },
    { nome: 'Internet', icone: 'wifi', cor: '#10b981' },
    { nome: 'Pagamento adiantado', icone: 'banknote', cor: '#f97316' },
    { nome: 'Pedágio', icone: 'coins', cor: '#84cc16' },
    { nome: 'Quilometragem', icone: 'gauge', cor: '#ef4444' },
    { nome: 'Restaurante', icone: 'utensils', cor: '#f59e0b' },
    { nome: 'Táxi', icone: 'car', cor: '#eab308' },
    { nome: 'Telefone', icone: 'phone', cor: '#06b6d4' },
    { nome: 'Transporte público', icone: 'bus', cor: '#8b5cf6' },
    { nome: 'Trem', icone: 'train', cor: '#6366f1' }
  ]

  // Verificar se já existem categorias
  const existingCategories = await prisma.categoria.count()
  
  if (existingCategories === 0) {
    for (const categoria of categorias) {
      await prisma.categoria.create({
        data: categoria
      })
    }
    console.log('✅ Categorias predefinidas criadas')
  } else {
    console.log('ℹ️ Categorias já existem, pulando criação')
  }

  // Criar relatórios de exemplo
  const relatorios = [
    {
      titulo: 'Viagem São Paulo - Janeiro 2024',
      dataInicio: new Date('2024-01-15'),
      dataFim: new Date('2024-01-18'),
      destino: 'São Paulo - SP',
      proposito: 'Reunião com cliente',
      status: 'finalizado',
      cliente: 'Empresa ABC Ltda',
      observacoes: 'Viagem para apresentação do projeto'
    },
    {
      titulo: 'Treinamento Rio de Janeiro',
      dataInicio: new Date('2024-02-10'),
      dataFim: new Date('2024-02-12'),
      destino: 'Rio de Janeiro - RJ',
      proposito: 'Treinamento técnico',
      status: 'reembolsado',
      cliente: 'Tech Solutions',
      observacoes: 'Curso de especialização'
    },
    {
      titulo: 'Visita Técnica Belo Horizonte',
      dataInicio: new Date('2024-03-05'),
      dataFim: new Date('2024-03-07'),
      destino: 'Belo Horizonte - MG',
      proposito: 'Visita técnica',
      status: 'em_andamento',
      cliente: 'Indústria XYZ',
      observacoes: 'Acompanhamento de implementação'
    }
  ]

  // Verificar se já existem relatórios
  const existingReports = await prisma.relatorio.count()
  
  if (existingReports === 0) {
    for (const relatorio of relatorios) {
      await prisma.relatorio.create({
        data: relatorio,
      })
    }
    console.log('✅ Relatórios de exemplo criados')
  } else {
    console.log('ℹ️ Relatórios já existem, pulando criação')
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })