const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Iniciando migração de despesas...')
  
  try {
    // Atualizar todas as despesas existentes para clienteACobrar = true
    const result = await prisma.despesa.updateMany({
      where: {
        clienteACobrar: false
      },
      data: {
        clienteACobrar: true
      }
    })
    
    console.log(`✅ ${result.count} despesas atualizadas com clienteACobrar = true`)
    
    // Como reembolsada tem default false, não precisa de ajuste adicional
    console.log('✅ Campo reembolsada já tem valor padrão correto')
    
    // Mostrar estatísticas finais
    const totalDespesas = await prisma.despesa.count()
    const despesasAReembolsar = await prisma.despesa.count({
      where: {
        clienteACobrar: true,
        reembolsada: false
      }
    })
    const despesasReembolsadas = await prisma.despesa.count({
      where: {
        reembolsada: true
      }
    })
    
    console.log('\n📊 Estatísticas finais:')
    console.log(`- Total de despesas: ${totalDespesas}`)
    console.log(`- A reembolsar pelo cliente: ${despesasAReembolsar}`)
    console.log(`- Já reembolsadas: ${despesasReembolsadas}`)
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })