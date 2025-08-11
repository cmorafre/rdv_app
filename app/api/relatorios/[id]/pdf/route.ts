import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import fs from 'fs/promises'
import path from 'path'

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

    // Buscar o relatório com todas as suas despesas
    const relatorio = await prisma.relatorio.findUnique({
      where: { id },
      include: {
        despesas: {
          include: {
            categoria: true,
            despesaQuilometragem: {
              include: {
                veiculo: true
              }
            },
            comprovantes: true
          },
          orderBy: {
            dataDespesa: 'desc'
          }
        }
      }
    })

    // Buscar dados do usuário atual (do authResult)
    const usuario = await prisma.usuario.findUnique({
      where: { id: authResult.userId },
      select: {
        nome: true,
        email: true
      }
    })

    if (!relatorio || !usuario) {
      return NextResponse.json(
        { error: "Relatório ou usuário não encontrado" },
        { status: 404 }
      )
    }

    // Carregar imagens dos comprovantes em base64
    const despesasComImagens = await Promise.all(
      relatorio.despesas.map(async (despesa) => {
        const comprovantesComImagens = await Promise.all(
          (despesa.comprovantes || []).map(async (comprovante) => {
            try {
              // Construir caminho do arquivo
              const filePath = path.join(process.cwd(), 'public', comprovante.url)
              
              // Verificar se arquivo existe
              try {
                await fs.access(filePath)
              } catch {
                console.warn(`Arquivo não encontrado: ${filePath}`)
                return { ...comprovante, base64Data: null }
              }
              
              // Ler arquivo e converter para base64
              const fileBuffer = await fs.readFile(filePath)
              const base64Data = fileBuffer.toString('base64')
              
              return {
                ...comprovante,
                base64Data
              }
            } catch (error) {
              console.error(`Erro ao carregar comprovante ${comprovante.id}:`, error)
              return { ...comprovante, base64Data: null }
            }
          })
        )
        
        return {
          ...despesa,
          categoria: despesa.categoria,
          despesaQuilometragem: despesa.despesaQuilometragem ? {
            ...despesa.despesaQuilometragem,
            veiculo: despesa.despesaQuilometragem.veiculo
          } : null,
          comprovantes: comprovantesComImagens
        }
      })
    )

    // Retornar dados JSON para o cliente gerar o PDF
    const pdfData = {
      relatorio: {
        titulo: relatorio.titulo,
        dataInicio: relatorio.dataInicio,
        dataFim: relatorio.dataFim,
        status: relatorio.status,
        usuario: usuario,
        despesas: despesasComImagens,
        cliente: relatorio.cliente,
        proposito: relatorio.proposito
      }
    }

    return NextResponse.json(pdfData)

  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

