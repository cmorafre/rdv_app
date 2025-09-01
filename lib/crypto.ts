// Wrapper para bcryptjs com suporte ao Edge Runtime
let bcrypt: typeof import('bcryptjs')

// Função para carregar bcryptjs apenas no Node.js runtime
async function getBcrypt() {
  if (typeof window !== 'undefined') {
    throw new Error('bcrypt cannot be used in the browser')
  }
  
  if (!bcrypt) {
    bcrypt = await import('bcryptjs')
  }
  
  return bcrypt
}

export async function hashPassword(password: string): Promise<string> {
  const bcryptModule = await getBcrypt()
  return bcryptModule.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  const bcryptModule = await getBcrypt()
  return bcryptModule.compare(password, hashedPassword)
}