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
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })