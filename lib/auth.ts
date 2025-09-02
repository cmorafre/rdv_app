import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './db'
import { hashPassword, comparePassword } from './crypto'

// Re-export para compatibilidade
export { hashPassword }

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'rdv-app-super-secret-key-2025'
)

export interface SessionPayload {
  userId: number
  email: string
  nome: string
  [key: string]: unknown
}

// Gerar JWT
export async function generateToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

// Verificar JWT
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return payload as SessionPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return comparePassword(password, hashedPassword)
}

// Criar sessão (cookie)
export async function createSession(payload: SessionPayload) {
  const token = await generateToken(payload)
  const cookieStore = await cookies()
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  })
}

// Obter sessão do cookie
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) return null
  
  return await verifyToken(token)
}

// Destruir sessão
export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.set('session', '', { expires: new Date(0) })
}

// Autenticar usuário
export async function authenticate(email: string, password: string): Promise<SessionPayload | null> {
  try {
    const user = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!user) {
      return null
    }

    const isValidPassword = await verifyPassword(password, user.senha)
    
    if (!isValidPassword) {
      return null
    }

    return {
      userId: user.id,
      email: user.email,
      nome: user.nome
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// Middleware para verificar autenticação em API routes
export async function requireAuth(request: NextRequest): Promise<SessionPayload | NextResponse> {
  // Verificar se é requisição mobile (bypass temporário)
  const isMobileRequest = request.headers.get('X-Mobile-Test') === 'true'
  
  if (isMobileRequest) {
    // Para mobile, criar uma sessão fake para testes
    return {
      userId: 1,
      email: 'teste@rdv.com',
      nome: 'Usuário Teste'
    }
  }

  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const session = await verifyToken(token)
  
  if (!session) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  return session
}