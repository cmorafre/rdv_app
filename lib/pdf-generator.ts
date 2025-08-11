import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface Usuario {
  nome: string
  email: string
}

interface Categoria {
  nome: string
}

interface Veiculo {
  identificacao: string
  tipo: string
  marca?: string
  modelo?: string
}

interface DespesaQuilometragem {
  origem: string
  destino: string
  distanciaKm: number
  valorPorKm: number | string
  veiculo: Veiculo
}

interface Despesa {
  dataDespesa: string
  categoria: Categoria
  descricao: string
  fornecedor?: string
  valor: number
  reembolsavel: boolean
  reembolsada: boolean
  clienteACobrar: boolean
  despesaQuilometragem?: DespesaQuilometragem | null
}

interface RelatorioData {
  titulo: string
  dataInicio: string
  dataFim: string
  status: string
  usuario: Usuario
  despesas: Despesa[]
}

export function generateRelatorioPDF(data: RelatorioData): ArrayBuffer {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  // Configurações modernas
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Cores modernas
  const primaryColor = [30, 41, 59] // slate-800
  const accentColor = [59, 130, 246] // blue-500
  const successColor = [34, 197, 94] // green-500
  const lightGray = [248, 250, 252] // slate-50
  const mediumGray = [148, 163, 184] // slate-400

  // Header moderno com linha decorativa
  doc.setFillColor(...accentColor)
  doc.rect(0, 0, pageWidth, 12, 'F')
  
  yPosition = 25
  
  // Título principal
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...primaryColor)
  doc.text("Relatório de Despesas", pageWidth / 2, yPosition, { align: "center" })
  
  yPosition += 15

  // Card de informações do relatório
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, yPosition, contentWidth, 35, 2, 2, 'F')
  
  yPosition += 8
  
  // Informações em duas colunas
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...mediumGray)
  
  const leftCol = margin + 8
  const rightCol = pageWidth / 2 + 10
  
  // Coluna esquerda
  doc.text("RELATÓRIO", leftCol, yPosition)
  yPosition += 4
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...primaryColor)
  doc.text(data.titulo, leftCol, yPosition)
  
  yPosition += 8
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...mediumGray)
  doc.text("PERÍODO", leftCol, yPosition)
  yPosition += 4
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...primaryColor)
  doc.text(`${formatDate(data.dataInicio)} a ${formatDate(data.dataFim)}`, leftCol, yPosition)
  
  // Coluna direita
  yPosition -= 12
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...mediumGray)
  doc.text("RESPONSÁVEL", rightCol, yPosition)
  yPosition += 4
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...primaryColor)
  doc.text(data.usuario.nome, rightCol, yPosition)
  
  yPosition += 8
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...mediumGray)
  doc.text("STATUS", rightCol, yPosition)
  yPosition += 4
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...primaryColor)
  const statusText = data.status === 'em_andamento' ? 'Em Andamento' : 
                    data.status === 'finalizado' ? 'Finalizado' : 'Reembolsado'
  doc.text(statusText, rightCol, yPosition)
  
  yPosition += 25

  // Resumo financeiro moderno
  const valorTotal = data.despesas.reduce((acc, despesa) => acc + Number(despesa.valor), 0)
  const despesasReembolsaveis = data.despesas.filter(d => d.reembolsavel && !d.reembolsada)
  const valorReembolsavel = despesasReembolsaveis.reduce((acc, despesa) => acc + Number(despesa.valor), 0)
  const valorReembolsado = data.despesas.filter(d => d.reembolsada).reduce((acc, despesa) => acc + Number(despesa.valor), 0)

  // Cards de resumo financeiro
  const cardWidth = (contentWidth - 10) / 3
  const cardHeight = 25
  
  // Card 1 - Total
  doc.setFillColor(59, 130, 246) // blue-500
  doc.roundedRect(margin, yPosition, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("VALOR TOTAL", margin + cardWidth/2, yPosition + 8, { align: "center" })
  doc.setFontSize(14)
  doc.text(formatCurrency(valorTotal), margin + cardWidth/2, yPosition + 16, { align: "center" })
  doc.setFontSize(8)
  doc.text(`${data.despesas.length} despesas`, margin + cardWidth/2, yPosition + 21, { align: "center" })
  
  // Card 2 - A Reembolsar
  doc.setFillColor(239, 68, 68) // red-500
  doc.roundedRect(margin + cardWidth + 5, yPosition, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("A REEMBOLSAR", margin + cardWidth + 5 + cardWidth/2, yPosition + 8, { align: "center" })
  doc.setFontSize(14)
  doc.text(formatCurrency(valorReembolsavel), margin + cardWidth + 5 + cardWidth/2, yPosition + 16, { align: "center" })
  doc.setFontSize(8)
  doc.text(`${despesasReembolsaveis.length} pendentes`, margin + cardWidth + 5 + cardWidth/2, yPosition + 21, { align: "center" })
  
  // Card 3 - Reembolsado
  doc.setFillColor(34, 197, 94) // green-500
  doc.roundedRect(margin + (cardWidth + 5) * 2, yPosition, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("REEMBOLSADO", margin + (cardWidth + 5) * 2 + cardWidth/2, yPosition + 8, { align: "center" })
  doc.setFontSize(14)
  doc.text(formatCurrency(valorReembolsado), margin + (cardWidth + 5) * 2 + cardWidth/2, yPosition + 16, { align: "center" })
  
  yPosition += cardHeight + 20

  // Verificar se precisa de nova página
  if (yPosition + 40 > pageHeight - 30) {
    doc.addPage()
    yPosition = margin + 20
  }

  // Seção de despesas
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...primaryColor)
  doc.text("Detalhamento das Despesas", margin, yPosition)
  yPosition += 10

  // Preparar dados da tabela de forma mais inteligente
  const tableData = data.despesas.map(despesa => [
    formatDate(despesa.dataDespesa),
    despesa.categoria.nome,
    truncateText(despesa.descricao, 30),
    truncateText(despesa.fornecedor || '-', 18),
    formatCurrency(Number(despesa.valor)),
    despesa.reembolsavel ? (despesa.reembolsada ? 'Pago' : 'Pendente') : 'N/A'
  ])

  // Tabela moderna
  autoTable(doc, {
    startY: yPosition,
    head: [['Data', 'Categoria', 'Descrição', 'Fornecedor', 'Valor', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' }, // Data
      1: { cellWidth: 24 }, // Categoria
      2: { cellWidth: 42 }, // Descrição
      3: { cellWidth: 28 }, // Fornecedor
      4: { cellWidth: 24, halign: 'right' }, // Valor
      5: { cellWidth: 22, halign: 'center' } // Status
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    margin: { left: margin, right: margin },
    tableWidth: 'auto'
  })

  // Despesas de quilometragem
  const despesasQuilometragem = data.despesas.filter(d => d.despesaQuilometragem)
  
  if (despesasQuilometragem.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50
    yPosition = finalY + 15
    
    if (yPosition + 40 > pageHeight - 30) {
      doc.addPage()
      yPosition = margin + 20
    }

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...primaryColor)
    doc.text("Detalhamento de Quilometragem", margin, yPosition)
    yPosition += 10

    const quilometragemData = despesasQuilometragem.map(despesa => {
      const quilo = despesa.despesaQuilometragem!
      return [
        formatDate(despesa.dataDespesa),
        quilo.veiculo.identificacao,
        truncateText(quilo.origem, 20),
        truncateText(quilo.destino, 20),
        `${Number(quilo.distanciaKm).toFixed(1)} km`,
        formatCurrency(Number(quilo.valorPorKm)),
        formatCurrency(Number(despesa.valor))
      ]
    })

    autoTable(doc, {
      startY: yPosition,
      head: [['Data', 'Veículo', 'Origem', 'Destino', 'Distância', 'R$/Km', 'Total']],
      body: quilometragemData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [34, 197, 94], // green-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' }, // Data
        1: { cellWidth: 25 }, // Veículo
        2: { cellWidth: 30 }, // Origem
        3: { cellWidth: 30 }, // Destino
        4: { cellWidth: 22, halign: 'center' }, // Distância
        5: { cellWidth: 20, halign: 'right' }, // R$/Km
        6: { cellWidth: 25, halign: 'right' } // Total
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244] // green-50
      },
      margin: { left: margin, right: margin }
    })
  }

  // Rodapé moderno
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    // Linha no rodapé
    doc.setDrawColor(...mediumGray)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)
    
    // Informações do rodapé
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...mediumGray)
    
    doc.text(`Página ${i} de ${totalPages}`, margin, pageHeight - 12)
    doc.text(`Sistema RDV - Gerado em ${formatDateTime(new Date())}`, pageWidth - margin, pageHeight - 12, { align: "right" })
  }

  return doc.output('arraybuffer') as ArrayBuffer
}

// Função auxiliar para truncar texto
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || ''
  return text.substring(0, maxLength - 3) + '...'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("pt-BR")
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value)
}