import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAuth, apenasGestor } from '@/lib/auth'
import { escopoUsuario } from '@/lib/escopo'
import { prisma } from '@/lib/db'

const UsuarioUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255).optional(),
  email: z.string().email("E-mail inválido").optional(),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  perfil: z.enum(['gestor', 'usuario']).optional(),
  ativo: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const usuario = await prisma.usuario.findFirst({
      where: { id, ...escopoUsuario(authResult) },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = UsuarioUpdateSchema.parse(body)

    // Verificar se o usuário existe
    const existingUser = await prisma.usuario.findFirst({
      where: { id, ...escopoUsuario(authResult) }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Cada um edita os próprios dados; o gestor edita qualquer usuário da conta
    const proprio = id === authResult.userId
    if (!proprio) {
      const negado = apenasGestor(authResult)
      if (negado) return negado
    }

    // Perfil e status: só o gestor, e nunca em si mesmo (a conta não pode ficar sem gestor)
    if (validatedData.perfil !== undefined || validatedData.ativo !== undefined) {
      const negado = apenasGestor(authResult)
      if (negado) return negado

      if (proprio) {
        return NextResponse.json(
          { error: "Você não pode alterar o próprio perfil ou status" },
          { status: 400 }
        )
      }
    }

    // Se está mudando o email, verificar se não existe outro usuário com o mesmo
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const duplicateUser = await prisma.usuario.findUnique({
        where: { email: validatedData.email }
      })

      if (duplicateUser) {
        return NextResponse.json(
          { error: "Já existe um usuário com este e-mail" },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    
    if (validatedData.nome) updateData.nome = validatedData.nome
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.perfil !== undefined) updateData.perfil = validatedData.perfil
    if (validatedData.ativo !== undefined) updateData.ativo = validatedData.ativo
    
    // Se senha foi fornecida, fazer hash
    if (validatedData.senha) {
      updateData.senha = await bcrypt.hash(validatedData.senha, 10)
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(usuario)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const negado = apenasGestor(authResult)
    if (negado) return negado

    // Verificar se o usuário existe
    const existingUser = await prisma.usuario.findFirst({
      where: { id, ...escopoUsuario(authResult) },
      include: { _count: { select: { relatorios: true, veiculos: true, relatoriosAprovados: true } } }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    if (id === authResult.userId) {
      return NextResponse.json(
        { error: "Você não pode excluir o próprio usuário" },
        { status: 400 }
      )
    }

    const { relatorios, veiculos, relatoriosAprovados } = existingUser._count
    if (relatorios + veiculos + relatoriosAprovados > 0) {
      return NextResponse.json(
        { error: "Este usuário tem relatórios ou veículos. Desative-o em vez de excluir." },
        { status: 400 }
      )
    }

    await prisma.usuario.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Usuário excluído com sucesso" })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}