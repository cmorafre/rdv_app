import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './db'
import { hashPassword, comparePassword } from './crypto'

// Re-export para compatibilidade
export { hashPassword }

// Sem valor padrão: um segredo conhecido permitiria forjar logins
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado')
}

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET)

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

// Criar sessão (cookie) e retornar o token para clientes sem cookie (app mobile)
export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await generateToken(payload)
  const cookieStore = await cookies()
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  })

  return token
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

// Autenticar usuário (inativo ou sem conta não entra)
export async function authenticate(email: string, password: string): Promise<SessionPayload | null> {
  try {
    const user = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!user || !user.ativo || !user.contaId) {
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

// Token da requisição: header Authorization (app mobile) ou cookie de sessão (web)
function getRequestToken(request: NextRequest): string | undefined {
  const authorization = request.headers.get('Authorization')

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return request.cookies.get('session')?.value
}

export type Perfil = 'gestor' | 'usuario'

// Sessão de uma requisição autenticada. Conta, perfil e status vêm do banco a cada
// requisição (não do token): desativar um usuário ou trocar o perfil vale na hora
export interface Sessao {
  userId: number
  email: string
  nome: string
  contaId: number
  perfil: Perfil
}

// Middleware para verificar autenticação em API routes
export async function requireAuth(request: NextRequest): Promise<Sessao | NextResponse> {
  const token = getRequestToken(request)

  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const session = await verifyToken(token)
  
  if (!session) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, nome: true, contaId: true, perfil: true, ativo: true }
  })

  if (!usuario || !usuario.ativo || !usuario.contaId) {
    return NextResponse.json({ error: 'Usuário inativo ou sem conta' }, { status: 401 })
  }

  return {
    userId: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    contaId: usuario.contaId,
    perfil: usuario.perfil === 'gestor' ? 'gestor' : 'usuario'
  }
}

// Resposta padrão para ações que só o gestor pode fazer
export function apenasGestor(sessao: Sessao): NextResponse | null {
  if (sessao.perfil === 'gestor') return null
  return NextResponse.json({ error: 'Apenas o gestor pode fazer isso' }, { status: 403 })
}
