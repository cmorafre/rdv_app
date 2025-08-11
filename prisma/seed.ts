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

  // Criar veículos de exemplo
  const veiculos = [
    {
      tipo: 'Carro',
      marca: 'Toyota',
      modelo: 'Corolla',
      categoria: 'Sedan',
      combustivel: 'Flex',
      identificacao: 'ABC-1234',
      potencia: 154,
      valorPorKm: 0.65
    },
    {
      tipo: 'Carro',
      marca: 'Volkswagen',
      modelo: 'Gol',
      categoria: 'Hatch',
      combustivel: 'Flex',
      identificacao: 'DEF-5678',
      potencia: 120,
      valorPorKm: 0.55
    },
    {
      tipo: 'Moto',
      marca: 'Honda',
      modelo: 'CG 160',
      categoria: 'Street',
      combustivel: 'Gasolina',
      identificacao: 'MOT-9876',
      potencia: 162,
      valorPorKm: 0.25
    }
  ]

  // Verificar se já existem veículos
  const existingVehicles = await prisma.veiculo.count()
  
  if (existingVehicles === 0) {
    for (const veiculo of veiculos) {
      await prisma.veiculo.create({
        data: veiculo
      })
    }
    console.log('✅ Veículos de exemplo criados')
  } else {
    console.log('ℹ️ Veículos já existem, pulando criação')
  }

  // Criar despesas de exemplo
  const existingExpenses = await prisma.despesa.count()
  
  if (existingExpenses === 0) {
    // Buscar dados necessários
    const relatorioSP = await prisma.relatorio.findFirst({
      where: { titulo: 'Viagem São Paulo - Janeiro 2024' }
    })
    const relatorioRJ = await prisma.relatorio.findFirst({
      where: { titulo: 'Treinamento Rio de Janeiro' }
    })
    const categoriaCombustivel = await prisma.categoria.findFirst({
      where: { nome: 'Combustível' }
    })
    const categoriaHotel = await prisma.categoria.findFirst({
      where: { nome: 'Hotel' }
    })
    const categoriaRestaurante = await prisma.categoria.findFirst({
      where: { nome: 'Restaurante' }
    })
    const categoriaQuilometragem = await prisma.categoria.findFirst({
      where: { nome: 'Quilometragem' }
    })
    const veiculo = await prisma.veiculo.findFirst({
      where: { identificacao: 'ABC-1234' }
    })

    if (relatorioSP && categoriaCombustivel && categoriaHotel && categoriaRestaurante) {
      // Despesas do relatório SP
      await prisma.despesa.create({
        data: {
          relatorioId: relatorioSP.id,
          categoriaId: categoriaCombustivel.id,
          dataDespesa: new Date('2024-01-15'),
          descricao: 'Abastecimento para viagem',
          fornecedor: 'Posto Shell',
          valor: 120.50,
          observacoes: 'Gasolina comum',
          reembolsavel: true,
          reembolsada: false,
          clienteACobrar: true
        }
      })

      await prisma.despesa.create({
        data: {
          relatorioId: relatorioSP.id,
          categoriaId: categoriaHotel.id,
          dataDespesa: new Date('2024-01-15'),
          descricao: 'Hotel Copacabana Palace',
          fornecedor: 'Copacabana Palace',
          valor: 450.00,
          observacoes: 'Quarto standard - 3 diárias',
          reembolsavel: true,
          reembolsada: true,
          clienteACobrar: false
        }
      })

      await prisma.despesa.create({
        data: {
          relatorioId: relatorioSP.id,
          categoriaId: categoriaRestaurante.id,
          dataDespesa: new Date('2024-01-16'),
          descricao: 'Jantar de negócios',
          fornecedor: 'Restaurante Fasano',
          valor: 280.00,
          observacoes: 'Jantar com cliente',
          reembolsavel: true,
          reembolsada: false,
          clienteACobrar: true
        }
      })

      // Despesa de quilometragem
      if (categoriaQuilometragem && veiculo) {
        const despesaQuilometragem = await prisma.despesa.create({
          data: {
            relatorioId: relatorioSP.id,
            categoriaId: categoriaQuilometragem.id,
            dataDespesa: new Date('2024-01-15'),
            descricao: 'Deslocamento São Paulo',
            valor: 195.00, // 300km * 0.65
            observacoes: 'Ida e volta ao centro da cidade',
            reembolsavel: true,
            reembolsada: false,
            clienteACobrar: true
          }
        })

        // Criar registro de quilometragem
        await prisma.despesaQuilometragem.create({
          data: {
            despesaId: despesaQuilometragem.id,
            veiculoId: veiculo.id,
            origem: 'Campinas - SP',
            destino: 'São Paulo - SP',
            distanciaKm: 300,
            valorPorKm: 0.65
          }
        })
      }
    }

    if (relatorioRJ && categoriaRestaurante) {
      await prisma.despesa.create({
        data: {
          relatorioId: relatorioRJ.id,
          categoriaId: categoriaRestaurante.id,
          dataDespesa: new Date('2024-02-10'),
          descricao: 'Almoço durante treinamento',
          fornecedor: 'Restaurante Aprazível',
          valor: 85.00,
          observacoes: 'Almoço executivo',
          reembolsavel: true,
          reembolsada: true,
          clienteACobrar: false
        }
      })
    }

    console.log('✅ Despesas de exemplo criadas')
  } else {
    console.log('ℹ️ Despesas já existem, pulando criação')
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