import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const CategoriaUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo").optional(),
  icone: z.string().optional().nullable(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal").optional().nullable(),
  ativa: z.boolean().optional(),
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

    const categoria = await prisma.categoria.findUnique({
      where: { id }
    })

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
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
    const validatedData = CategoriaUpdateSchema.parse(body)

    // Verificar se a categoria existe
    const existingCategoria = await prisma.categoria.findUnique({
      where: { id }
    })

    if (!existingCategoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    // Se o nome está sendo alterado, verificar se não existe outra com o mesmo nome
    if (validatedData.nome && validatedData.nome !== existingCategoria.nome) {
      const duplicateCategoria = await prisma.categoria.findFirst({
        where: { 
          nome: {
            equals: validatedData.nome,
            mode: 'insensitive'
          },
          NOT: { id }
        }
      })

      if (duplicateCategoria) {
        return NextResponse.json(
          { error: "Já existe uma categoria com este nome" },
          { status: 409 }
        )
      }
    }

    const categoria = await prisma.categoria.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(categoria)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar categoria:', error)
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

    // Verificar se a categoria existe
    const existingCategoria = await prisma.categoria.findUnique({
      where: { id }
    })

    if (!existingCategoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se há despesas usando esta categoria
    const despesasAssociadas = await prisma.despesa.count({
      where: { categoriaId: id }
    })

    if (despesasAssociadas > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir categoria com ${despesasAssociadas} despesa(s) associada(s). Desative a categoria em vez de excluí-la.` },
        { status: 400 }
      )
    }

    await prisma.categoria.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Categoria excluída com sucesso" })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}