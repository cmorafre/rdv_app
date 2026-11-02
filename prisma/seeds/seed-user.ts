import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Criar usuário de teste
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  // Conta de teste (só para bancos de desenvolvimento)
  const conta =
    (await prisma.conta.findFirst({ where: { nome: 'Conta de teste' } })) ??
    (await prisma.conta.create({ data: { nome: 'Conta de teste', tipo: 'individual' } }))

  const testUser = await prisma.usuario.upsert({
    where: { email: 'teste@rdv.com' },
    update: {},
    create: {
      nome: 'Usuário Teste',
      email: 'teste@rdv.com',
      senha: hashedPassword,
      contaId: conta.id,
      perfil: 'gestor',
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