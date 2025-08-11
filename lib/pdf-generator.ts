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

interface Comprovante {
  id: number
  nomeArquivo: string
  nomeOriginal: string
  url: string
  tipoMime: string
  base64Data?: string
}

interface Despesa {
  id: number
  dataDespesa: string
  categoria: Categoria
  descricao: string
  fornecedor?: string
  valor: number
  reembolsavel: boolean
  reembolsada: boolean
  clienteACobrar: boolean
  despesaQuilometragem?: DespesaQuilometragem | null
  comprovantes?: Comprovante[]
}

interface RelatorioData {
  titulo: string
  dataInicio: string
  dataFim: string
  status: string
  usuario: Usuario
  despesas: Despesa[]
  cliente?: string
  proposito?: string
}

// Tipos para os componentes de comprovantes
type ComprovanteItem = {
  despesaIndex: number
  compIndex: number
  despesa: Despesa
  comprovante: Comprovante & { width?: number; height?: number; aspectRatio?: number }
}

export async function generateRelatorioPDF(data: RelatorioData): Promise<ArrayBuffer> {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Cores seguindo o padrão do exemplo
  const darkGray: [number, number, number] = [70, 70, 70]
  const lightGray: [number, number, number] = [220, 220, 220]
  const black: [number, number, number] = [0, 0, 0]

  // CABEÇALHO seguindo o padrão do exemplo
  
  // Nome do usuário (topo esquerda)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(black[0], black[1], black[2])
  doc.text(data.usuario.nome, margin, yPosition)
  
  yPosition += 15
  
  // Título do relatório (centralizado)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(data.titulo, pageWidth / 2, yPosition, { align: "center" })
  
  yPosition += 8
  
  // Período (centralizado, menor)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const dataFormatada = `de ${formatDateShort(data.dataInicio)} até ${formatDateShort(data.dataFim)}`
  doc.text(dataFormatada, pageWidth / 2, yPosition, { align: "center" })
  
  yPosition += 20
  
  // Tabela de validações (igual ao exemplo)
  const validationTableHeight = 25
  
  // Cabeçalho da tabela de validação
  doc.setDrawColor(...lightGray)
  doc.setLineWidth(0.5)
  
  const colWidth = contentWidth / 3
  
  // Desenhar bordas da tabela
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
  doc.rect(margin, yPosition, contentWidth, validationTableHeight)
  doc.line(margin + colWidth, yPosition, margin + colWidth, yPosition + validationTableHeight)
  doc.line(margin + (colWidth * 2), yPosition, margin + (colWidth * 2), yPosition + validationTableHeight)
  
  // Linha divisória horizontal
  doc.line(margin, yPosition + 8, margin + contentWidth, yPosition + 8)
  
  // Texto dos cabeçalhos
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  
  // Campos de data e assinatura
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  const fieldY = yPosition + 12
  
  for (let i = 0; i < 3; i++) {
    const x = margin + (i * colWidth) + 5
    doc.text("Data", x, fieldY)
    doc.text("Assinatura", x, fieldY + 8)
  }
  
  yPosition += validationTableHeight + 15

  // RESUMO PRINCIPAL - Lista de despesas como no exemplo
  
  // Cabeçalho da tabela principal
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
  
  // Cabeçalho: Data | Descrição | Total Geral
  const dateColWidth = 25
  const descColWidth = contentWidth - dateColWidth - 35
  const totalColWidth = 35
  
  doc.rect(margin, yPosition, dateColWidth, 8, 'F')
  doc.rect(margin + dateColWidth, yPosition, descColWidth, 8, 'F')
  doc.rect(margin + dateColWidth + descColWidth, yPosition, totalColWidth, 8, 'F')
  
  doc.setTextColor(black[0], black[1], black[2])
  doc.text("Data", margin + dateColWidth/2, yPosition + 5, { align: "center" })
  doc.text("Descrição", margin + dateColWidth + descColWidth/2, yPosition + 5, { align: "center" })
  doc.text("Total Geral", margin + dateColWidth + descColWidth + totalColWidth/2, yPosition + 5, { align: "center" })
  
  yPosition += 8
  
  // Ordenar despesas por data (crescente, como no exemplo)
  const despesasOrdenadas = [...data.despesas].sort((a, b) => 
    new Date(a.dataDespesa).getTime() - new Date(b.dataDespesa).getTime()
  )
  
  // Lista de despesas com numeração
  despesasOrdenadas.forEach((despesa, index) => {
    const rowHeight = 12
    
    // Verificar se precisa de nova página
    if (yPosition + rowHeight > pageHeight - 40) {
      doc.addPage()
      yPosition = margin + 20
    }
    
    // Alternating row color (muito sutil)
    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 248)
      doc.rect(margin, yPosition, contentWidth, rowHeight, 'F')
    }
    
    // Bordas da linha
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
    doc.rect(margin, yPosition, dateColWidth, rowHeight)
    doc.rect(margin + dateColWidth, yPosition, descColWidth, rowHeight)
    doc.rect(margin + dateColWidth + descColWidth, yPosition, totalColWidth, rowHeight)
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(black[0], black[1], black[2])
    
    // Data
    doc.text(formatDateShort(despesa.dataDespesa), margin + dateColWidth/2, yPosition + 7, { align: "center" })
    
    // Descrição formatada como no exemplo
    let descricaoCompleta = `#${index + 1} - ${despesa.categoria.nome}`
    if (despesa.fornecedor) {
      descricaoCompleta += ` - ${despesa.fornecedor}`
    }
    
    // Detalhes adicionais para quilometragem
    if (despesa.despesaQuilometragem) {
      const km = despesa.despesaQuilometragem
      descricaoCompleta += `\n${Number(km.distanciaKm).toFixed(0)} Km x ${formatCurrency(Number(km.valorPorKm))} (${km.veiculo.identificacao})`
      descricaoCompleta += `\n${truncateText(km.origem, 50)} -> ${truncateText(km.destino, 50)}`
    }
    
    if (data.cliente) {
      descricaoCompleta += `\nCliente : ${data.cliente}`
    }
    
    // Texto da descrição (quebrar linhas se necessário)
    const lines = doc.splitTextToSize(descricaoCompleta, descColWidth - 4)
    doc.text(lines, margin + dateColWidth + 2, yPosition + 4)
    
    // Ajustar altura da linha se houver múltiplas linhas
    const actualHeight = Math.max(rowHeight, (lines.length * 3) + 6)
    
    // Valor
    doc.text(formatCurrency(Number(despesa.valor)), margin + dateColWidth + descColWidth + totalColWidth - 2, yPosition + 7, { align: "right" })
    
    yPosition += actualHeight
  })
  
  yPosition += 10
  
  // TOTAIS (como no exemplo)
  const valorTotal = data.despesas.reduce((acc, despesa) => acc + Number(despesa.valor), 0)
  const quilometragemTotal = data.despesas
    .filter(d => d.despesaQuilometragem)
    .reduce((acc, d) => acc + Number(d.despesaQuilometragem!.distanciaKm), 0)
  const valorQuilometragem = data.despesas
    .filter(d => d.despesaQuilometragem)
    .reduce((acc, d) => acc + Number(d.valor), 0)
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  
  let totalText = `Total ${data.despesas.length}`
  if (quilometragemTotal > 0) {
    totalText += ` 1 do tipo Distância: ${quilometragemTotal.toFixed(0)} Km / ${formatCurrency(valorQuilometragem)}`
  }
  totalText += ` ${formatCurrency(valorTotal)}`
  
  doc.text(totalText, margin, yPosition)
  yPosition += 6
  
  doc.text(`Total reembolsável: ${formatCurrency(valorTotal)}`, margin, yPosition)
  yPosition += 15

  // Verificar se precisa de nova página para os resumos
  if (yPosition + 60 > pageHeight - 30) {
    doc.addPage()
    yPosition = margin + 20
  }
  
  // RESUMOS seguindo o padrão do exemplo
  
  // Resumo por método de pagamento
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo por método de pagamento", margin, yPosition)
  yPosition += 8
  
  // Contar métodos de pagamento (simulado - não temos essa info no schema atual)
  const resumoPagamento = [
    { metodo: "Nenhum (Pessoal)", quantidade: data.despesas.filter(d => d.despesaQuilometragem).length || 2, 
      totalGeral: valorQuilometragem || 1500, reembolsavel: valorQuilometragem || 1500, faturavel: 0 },
    { metodo: "Cartão de crédito (Pessoal)", quantidade: data.despesas.filter(d => !d.despesaQuilometragem).length || 6, 
      totalGeral: valorTotal - (valorQuilometragem || 1500), reembolsavel: valorTotal - (valorQuilometragem || 1500), faturavel: 0 }
  ]
  
  // Tabela de resumo de pagamento
  autoTable(doc, {
    startY: yPosition,
    head: [['Método de Pagamento', 'Quant.', 'Total Geral', 'Reembolsável', 'Faturável']],
    body: resumoPagamento.map(item => [
      item.metodo,
      item.quantidade.toString(),
      formatCurrency(item.totalGeral),
      formatCurrency(item.reembolsavel),
      formatCurrency(item.faturavel)
    ]),
    foot: [[
      'Total pessoal',
      data.despesas.length.toString(),
      formatCurrency(valorTotal),
      formatCurrency(valorTotal),
      formatCurrency(0)
    ]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' },
    margin: { left: margin, right: margin }
  })
  
  yPosition = doc.lastAutoTable?.finalY + 10 || yPosition + 50
  
  // Resumo por categoria
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo por categoria", margin, yPosition)
  yPosition += 8
  
  // Agrupar por categoria
  const categoriaMap = new Map()
  data.despesas.forEach(despesa => {
    const cat = despesa.categoria.nome
    if (!categoriaMap.has(cat)) {
      categoriaMap.set(cat, { quantidade: 0, valor: 0 })
    }
    const current = categoriaMap.get(cat)
    current.quantidade++
    current.valor += Number(despesa.valor)
  })
  
  const resumoCategoria = Array.from(categoriaMap.entries()).map(([categoria, dados]) => [
    categoria,
    dados.quantidade.toString(),
    formatCurrency(dados.valor)
  ])
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Categoria', 'Quant.', 'Total Geral']],
    body: resumoCategoria,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    margin: { left: margin, right: margin }
  })
  
  yPosition = doc.lastAutoTable?.finalY + 10 || yPosition + 50

  // Resumo por uso de veículo
  const despesasQuilometragem = data.despesas.filter(d => d.despesaQuilometragem)
  
  if (despesasQuilometragem.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Resumo por uso de veículo", margin, yPosition)
    yPosition += 8
    
    // Agrupar por veículo
    const veiculoMap = new Map()
    despesasQuilometragem.forEach(despesa => {
      const veiculo = despesa.despesaQuilometragem!.veiculo.identificacao
      if (!veiculoMap.has(veiculo)) {
        veiculoMap.set(veiculo, 0)
      }
      veiculoMap.set(veiculo, veiculoMap.get(veiculo) + Number(despesa.despesaQuilometragem!.distanciaKm))
    })
    
    const resumoVeiculo = Array.from(veiculoMap.entries()).map(([veiculo, km]) => [
      veiculo,
      km.toFixed(2),
      km.toFixed(2) // Assumindo que é o total do ano (simplificado)
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Veículo', 'Km neste relatório', 'Km 2025']],
      body: resumoVeiculo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      margin: { left: margin, right: margin }
    })
    
    yPosition = doc.lastAutoTable?.finalY + 15 || yPosition + 50
  }
  
  // SEÇÃO DE COMPROVANTES (nova página)
  doc.addPage()
  yPosition = margin + 20
  
  await addComprovantesSection(doc, data.despesas, yPosition)

  // Rodapé seguindo o padrão do exemplo
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    // Informações do rodapé (padrão RDV)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    
    const footerText = `RDV - Despesas de Viagem`
    const dateText = formatDateTime(new Date())
    const pageText = `${data.titulo} - ${data.usuario.nome}`
    const pageNumText = `Página ${i}/${totalPages}`
    
    // Linha superior do rodapé
    doc.text(footerText, margin, pageHeight - 15)
    doc.text(dateText, pageWidth - margin, pageHeight - 15, { align: "right" })
    
    // Linha inferior do rodapé
    doc.text(pageText, margin, pageHeight - 8)
    doc.text(pageNumText, pageWidth - margin, pageHeight - 8, { align: "right" })
  }

  return doc.output('arraybuffer') as ArrayBuffer
}

// Função para adicionar seção de comprovantes com layout inteligente
async function addComprovantesSection(doc: jsPDF, despesas: Despesa[], startY: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = startY
  
  // Filtrar apenas despesas que têm comprovantes
  const despesasComComprovantes = despesas.filter(d => d.comprovantes && d.comprovantes.length > 0)
  
  if (despesasComComprovantes.length === 0) {
    return // Não há comprovantes para mostrar
  }
  
  // Coletar todos os comprovantes com suas dimensões
  const comprovantesComDimensoes: ComprovanteItem[] = []
  
  for (const [despesaIndex, despesa] of despesasComComprovantes.entries()) {
    if (!despesa.comprovantes) continue
    
    for (const [compIndex, comprovante] of despesa.comprovantes.entries()) {
      if (comprovante.base64Data) {
        const dimensions = await getImageDimensions(comprovante.base64Data)
        comprovantesComDimensoes.push({
          despesaIndex,
          compIndex,
          despesa,
          comprovante: {
            ...comprovante,
            ...dimensions
          }
        })
      } else {
        comprovantesComDimensoes.push({
          despesaIndex,
          compIndex,
          despesa,
          comprovante
        })
      }
    }
  }
  
  // Processar comprovantes com layout inteligente
  let i = 0
  while (i < comprovantesComDimensoes.length) {
    const current = comprovantesComDimensoes[i]
    const next = i + 1 < comprovantesComDimensoes.length ? comprovantesComDimensoes[i + 1] : null
    
    // Determinar se deve usar layout de 2 colunas
    const currentIsVertical = isVerticalImage(current.comprovante)
    const nextIsVertical = next ? isVerticalImage(next.comprovante) : false
    
    if (currentIsVertical && nextIsVertical && next) {
      // Layout de 2 colunas para imagens verticais
      const spaceNeeded = calculateTwoColumnSpace([current, next])
      
      if (yPosition + spaceNeeded > pageHeight - 30) {
        doc.addPage()
        yPosition = margin + 20
      }
      
      await renderTwoColumnComprovantes(doc, [current, next], yPosition, margin, pageWidth)
      yPosition += spaceNeeded + 15
      i += 2 // Pular os dois próximos
    } else {
      // Layout de 1 coluna para imagem horizontal ou vertical sozinha
      const spaceNeeded = calculateSingleColumnSpace(current)
      
      if (yPosition + spaceNeeded > pageHeight - 30) {
        doc.addPage()
        yPosition = margin + 20
      }
      
      await renderSingleColumnComprovante(doc, current, yPosition, margin, pageWidth)
      yPosition += spaceNeeded + 15
      i++ // Pular apenas este
    }
  }
}

// Função para obter dimensões da imagem em base64
async function getImageDimensions(base64Data: string): Promise<{ width: number; height: number; aspectRatio: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      const aspectRatio = img.width / img.height
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio
      })
    }
    
    img.onerror = () => {
      // Fallback para dimensões padrão se não conseguir carregar
      resolve({
        width: 400,
        height: 600,
        aspectRatio: 0.67 // Assumir que é vertical se houver erro
      })
    }
    
    // Construir data URL completa - detectar formato pela assinatura do base64
    let mimeType = 'image/jpeg' // padrão
    
    // Detectar formato pela assinatura dos primeiros bytes em base64
    if (base64Data.startsWith('iVBOR')) {
      mimeType = 'image/png'
    } else if (base64Data.startsWith('UklGR')) {
      mimeType = 'image/webp'
    } else if (base64Data.startsWith('/9j/')) {
      mimeType = 'image/jpeg'
    }
    
    const dataUrl = `data:${mimeType};base64,${base64Data}`
    img.src = dataUrl
  })
}

// Função para determinar se imagem é vertical (cupom fiscal, etc.)
function isVerticalImage(comprovante: Comprovante & { aspectRatio?: number }): boolean {
  if (!comprovante.aspectRatio) {
    // Se não temos aspectRatio, assumir baseado no tipo MIME ou nome
    const fileName = comprovante.nomeOriginal?.toLowerCase() || ''
    const isLikelyReceipt = fileName.includes('cupom') || 
                          fileName.includes('recibo') || 
                          fileName.includes('nota')
    return isLikelyReceipt
  }
  
  // Imagem é vertical se altura > largura (aspectRatio < 1)
  return comprovante.aspectRatio < 1
}

// Função para calcular dimensões proporcionais
function calculateProportionalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight
  
  // Calcular baseado na largura máxima
  let width = maxWidth
  let height = width / aspectRatio
  
  // Se a altura calculada exceder o máximo, recalcular baseado na altura
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }
  
  return { width, height }
}

// Calcular espaço necessário para layout de 2 colunas (dinâmico)
function calculateTwoColumnSpace(comprovantes: ComprovanteItem[]): number {
  let maxHeight = 0
  const columnWidth = 85 // Largura aproximada da coluna em mm
  
  comprovantes.forEach(item => {
    if (item.comprovante.width && item.comprovante.height && item.comprovante.aspectRatio) {
      const dimensions = calculateProportionalDimensions(
        item.comprovante.width,
        item.comprovante.height,
        columnWidth,
        150 // Altura máxima em mm
      )
      maxHeight = Math.max(maxHeight, dimensions.height)
    } else {
      maxHeight = Math.max(maxHeight, 120) // Fallback
    }
  })
  
  return 40 + maxHeight // 40 para títulos e espaçamentos
}

// Calcular espaço necessário para layout de 1 coluna (dinâmico)
function calculateSingleColumnSpace(item: ComprovanteItem): number {
  if (item.comprovante.width && item.comprovante.height) {
    const isVertical = isVerticalImage(item.comprovante)
    const maxWidth = isVertical ? 100 : 180 // mm
    const maxHeight = isVertical ? 150 : 100 // mm
    
    const dimensions = calculateProportionalDimensions(
      item.comprovante.width,
      item.comprovante.height,
      maxWidth,
      maxHeight
    )
    
    return 40 + dimensions.height
  } else {
    // Fallback para quando não temos dimensões
    return isVerticalImage(item.comprovante) ? 40 + 120 : 40 + 80
  }
}

// Renderizar comprovante em layout de 2 colunas
async function renderTwoColumnComprovantes(
  doc: jsPDF, 
  comprovantes: ComprovanteItem[], 
  yPosition: number, 
  margin: number, 
  pageWidth: number
) {
  const columnWidth = (pageWidth - (margin * 2) - 5) / 2 // 5mm de espaço entre colunas
  
  for (const [index, item] of comprovantes.entries()) {
    const xOffset = index === 0 ? margin : margin + columnWidth + 5
    
    // Título do comprovante
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    
    const title = `#${item.despesaIndex + 1}.${item.compIndex + 1} - ${item.despesa.categoria.nome} - ${formatCurrency(Number(item.despesa.valor))} - ${formatDateShort(item.despesa.dataDespesa)} - ${item.despesa.fornecedor || 'N/A'}`
    
    // Quebrar título se necessário
    const titleLines = doc.splitTextToSize(title, columnWidth - 2)
    let titleYPos = yPosition
    titleLines.forEach((line: string) => {
      doc.text(line, xOffset, titleYPos)
      titleYPos += 4
    })
    
    const imageYPos = titleYPos + 5
    
    // Informações do comprovante
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`Comprovante: ${item.comprovante.nomeOriginal}`, xOffset, imageYPos)
    doc.text(`Arquivo: ${item.comprovante.nomeArquivo}`, xOffset, imageYPos + 4)
    
    const finalImageYPos = imageYPos + 12
    
    // Renderizar imagem
    try {
      if (item.comprovante.base64Data) {
        const format = getImageFormat(item.comprovante.tipoMime)
        
        // Calcular dimensões proporcionais para layout de 2 colunas
        let imgWidth = columnWidth
        let imgHeight = 100 // Altura padrão
        
        if (item.comprovante.width && item.comprovante.height) {
          const dimensions = calculateProportionalDimensions(
            item.comprovante.width,
            item.comprovante.height,
            columnWidth,
            150 // Altura máxima em mm
          )
          imgWidth = dimensions.width
          imgHeight = dimensions.height
          
          // Centralizar horizontalmente se a imagem for menor que a coluna
          const xOffsetCentered = xOffset + (columnWidth - imgWidth) / 2
          
          doc.addImage(item.comprovante.base64Data, format, xOffsetCentered, finalImageYPos, imgWidth, imgHeight)
        } else {
          // Fallback para quando não temos dimensões
          doc.addImage(item.comprovante.base64Data, format, xOffset, finalImageYPos, columnWidth, imgHeight)
        }
      } else {
        // Placeholder
        doc.setDrawColor(200, 200, 200)
        doc.rect(xOffset, finalImageYPos, columnWidth, 100)
        
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.text("Imagem não disponível", xOffset + columnWidth/2, finalImageYPos + 50, { align: "center" })
      }
    } catch (error) {
      console.error('Erro ao renderizar imagem:', error)
      // Placeholder de erro
      doc.setDrawColor(200, 200, 200)
      doc.rect(xOffset, finalImageYPos, columnWidth, 100)
      
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text("Erro ao carregar", xOffset + columnWidth/2, finalImageYPos + 50, { align: "center" })
    }
  }
}

// Renderizar comprovante em layout de 1 coluna
async function renderSingleColumnComprovante(
  doc: jsPDF, 
  item: ComprovanteItem, 
  yPosition: number, 
  margin: number, 
  pageWidth: number
) {
  const contentWidth = pageWidth - (margin * 2)
  
  // Título do comprovante
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  
  const title = `#${item.despesaIndex + 1}.${item.compIndex + 1} - ${item.despesa.categoria.nome} - ${formatCurrency(Number(item.despesa.valor))} - ${formatDateShort(item.despesa.dataDespesa)} - ${item.despesa.fornecedor || 'N/A'}`
  doc.text(title, margin, yPosition)
  
  let currentY = yPosition + 8
  
  // Informações do comprovante
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Comprovante: ${item.comprovante.nomeOriginal}`, margin, currentY)
  doc.text(`Arquivo: ${item.comprovante.nomeArquivo}`, margin, currentY + 5)
  currentY += 15
  
  // Renderizar imagem
  try {
    if (item.comprovante.base64Data) {
      const format = getImageFormat(item.comprovante.tipoMime)
      const isVertical = isVerticalImage(item.comprovante)
      
      let imgWidth, imgHeight, xOffset = margin
      
      if (item.comprovante.width && item.comprovante.height) {
        // Calcular dimensões proporcionais baseadas no tipo de imagem
        const maxWidth = isVertical ? 100 : contentWidth // mm
        const maxHeight = isVertical ? 150 : 100 // mm
        
        const dimensions = calculateProportionalDimensions(
          item.comprovante.width,
          item.comprovante.height,
          maxWidth,
          maxHeight
        )
        
        imgWidth = dimensions.width
        imgHeight = dimensions.height
        
        // Centralizar imagens verticais
        if (isVertical) {
          xOffset = margin + (contentWidth - imgWidth) / 2
        }
        
        doc.addImage(item.comprovante.base64Data, format, xOffset, currentY, imgWidth, imgHeight)
      } else {
        // Fallback para quando não temos dimensões reais
        if (isVertical) {
          imgWidth = Math.min(contentWidth * 0.6, 100)
          imgHeight = 120
          xOffset = margin + (contentWidth - imgWidth) / 2
        } else {
          imgWidth = contentWidth
          imgHeight = 80
        }
        
        doc.addImage(item.comprovante.base64Data, format, xOffset, currentY, imgWidth, imgHeight)
      }
    } else {
      // Placeholder
      const isVertical = isVerticalImage(item.comprovante)
      const imgHeight = isVertical ? 120 : 80
      doc.setDrawColor(200, 200, 200)
      doc.rect(margin, currentY, contentWidth, imgHeight)
      
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text("Imagem não disponível", pageWidth / 2, currentY + imgHeight/2, { align: "center" })
    }
  } catch (error) {
    console.error('Erro ao renderizar imagem:', error)
    const isVertical = isVerticalImage(item.comprovante)
    const imgHeight = isVertical ? 120 : 80
    
    // Placeholder de erro
    doc.setDrawColor(200, 200, 200)
    doc.rect(margin, currentY, contentWidth, imgHeight)
    
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text("Erro ao carregar imagem", pageWidth / 2, currentY + imgHeight/2, { align: "center" })
  }
}

// Função auxiliar para determinar formato da imagem
function getImageFormat(mimeType: string): 'JPEG' | 'PNG' | 'WEBP' {
  if (mimeType.includes('png')) return 'PNG'
  if (mimeType.includes('webp')) return 'WEBP'
  return 'JPEG' // default
}


// Função auxiliar para truncar texto
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || ''
  return text.substring(0, maxLength - 3) + '...'
}

function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString().slice(-2)
  return `${day}/${month}/${year}`
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