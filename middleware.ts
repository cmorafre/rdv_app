import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Rotas que requerem autenticação
const protectedRoutes = [
  '/',
  '/relatorios',
  '/despesas',
  '/veiculos',
  '/configuracoes',
]

// Rotas de autenticação (redirecionam se já autenticado)
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')

  // Verificar se há token de sessão
  const isAuthenticated = sessionCookie ? await verifyToken(sessionCookie.value) : null

  // Se estiver tentando acessar rotas de auth e já estiver autenticado
  if (authRoutes.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Verificar se a rota precisa de autenticação
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Se for rota protegida e não estiver autenticado
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}