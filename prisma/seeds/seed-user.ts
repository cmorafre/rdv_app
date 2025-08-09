import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
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

  console.log('Usuário de teste criado:', testUser.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })