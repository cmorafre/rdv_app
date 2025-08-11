import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'application/pdf'
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const despesaId = formData.get('despesaId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    if (!despesaId) {
      return NextResponse.json(
        { error: 'ID da despesa é obrigatório' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    // Validar tipo do arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou PDF.' },
        { status: 400 }
      )
    }

    // Verificar se a despesa existe
    const despesa = await prisma.despesa.findUnique({
      where: { id: parseInt(despesaId) }
    })

    if (!despesa) {
      return NextResponse.json(
        { error: 'Despesa não encontrada' },
        { status: 404 }
      )
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop()
    const fileName = `${randomUUID()}.${fileExtension}`
    
    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }

    // Salvar arquivo
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Salvar no banco de dados
    const comprovante = await prisma.comprovante.create({
      data: {
        despesaId: parseInt(despesaId),
        nomeArquivo: fileName,
        nomeOriginal: file.name,
        tamanho: file.size,
        tipoMime: file.type,
        url: `/uploads/${fileName}`
      }
    })

    return NextResponse.json({
      id: comprovante.id,
      url: comprovante.url,
      nomeOriginal: comprovante.nomeOriginal,
      tamanho: comprovante.tamanho,
      tipoMime: comprovante.tipoMime
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Deletar comprovante
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const comprovanteId = searchParams.get('id')

    if (!comprovanteId) {
      return NextResponse.json(
        { error: 'ID do comprovante é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar comprovante
    const comprovante = await prisma.comprovante.findUnique({
      where: { id: parseInt(comprovanteId) }
    })

    if (!comprovante) {
      return NextResponse.json(
        { error: 'Comprovante não encontrado' },
        { status: 404 }
      )
    }

    // Deletar arquivo físico
    const filePath = join(process.cwd(), 'public', comprovante.url)
    try {
      const { unlink } = await import('fs/promises')
      await unlink(filePath)
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      // Continue mesmo se não conseguir deletar o arquivo
    }

    // Deletar do banco de dados
    await prisma.comprovante.delete({
      where: { id: parseInt(comprovanteId) }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao deletar comprovante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}