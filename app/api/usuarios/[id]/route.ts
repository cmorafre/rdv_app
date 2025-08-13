import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const UsuarioUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255).optional(),
  email: z.string().email("E-mail inválido").optional(),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
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

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
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
    const existingUser = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
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
    const updateData: any = {}
    
    if (validatedData.nome) updateData.nome = validatedData.nome
    if (validatedData.email) updateData.email = validatedData.email
    
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

    // Verificar se o usuário existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // TODO: Verificar se usuário não possui relatórios/despesas associadas
    // Por ora, permitir exclusão

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