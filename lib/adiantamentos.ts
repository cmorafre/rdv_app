import { CalculoAdiantamento, ReembolsoInfo } from './types'

export class AdiantamentoCalculator {
  /**
   * Calcula o saldo restante e valor de reembolso
   */
  static calcularSaldo(adiantamento: number, valorTotal: number): CalculoAdiantamento {
    const saldoRestante = adiantamento - valorTotal

    let statusReembolso: CalculoAdiantamento['statusReembolso']
    let tipoReembolso: CalculoAdiantamento['tipoReembolso']

    if (saldoRestante > 0) {
      // Sobrou dinheiro - empresa deve receber de volta
      statusReembolso = 'devolver'
      tipoReembolso = 'A_DEVOLVER'
    } else if (saldoRestante < 0) {
      // Gastou mais que o adiantamento - funcionário deve receber
      statusReembolso = 'receber'
      tipoReembolso = 'A_RECEBER'
    } else {
      // Gastou exatamente o valor do adiantamento
      statusReembolso = 'quitado'
      tipoReembolso = 'QUITADO'
    }

    return {
      adiantamento,
      valorTotal,
      saldoRestante,
      valorReembolso: saldoRestante < 0 ? Math.abs(saldoRestante) : -saldoRestante,
      statusReembolso,
      tipoReembolso
    }
  }

  /**
   * Formata informações de reembolso para exibição
   */
  static formatarReembolso(calculo: CalculoAdiantamento): ReembolsoInfo {
    const { tipoReembolso, valorReembolso, statusReembolso } = calculo

    let descricao: string
    let cor: ReembolsoInfo['cor']

    switch (tipoReembolso) {
      case 'A_RECEBER':
        descricao = `A RECEBER: R$ ${Math.abs(valorReembolso).toFixed(2)}`
        cor = 'green'
        break
      case 'A_DEVOLVER':
        descricao = `A DEVOLVER: R$ ${Math.abs(valorReembolso).toFixed(2)}`
        cor = 'red'
        break
      case 'QUITADO':
        descricao = 'QUITADO: R$ 0,00'
        cor = 'gray'
        break
    }

    return {
      valor: Math.abs(valorReembolso),
      tipo: tipoReembolso,
      status: statusReembolso === 'quitado' ? 'processado' : 'pendente',
      descricao,
      cor
    }
  }

  /**
   * Formata saldo para exibição
   */
  static formatarSaldo(saldoRestante: number): {
    valor: string
    cor: 'green' | 'red' | 'gray'
    status: 'positivo' | 'negativo' | 'zero'
  } {
    const valorFormatado = `R$ ${Math.abs(saldoRestante).toFixed(2)}`

    if (saldoRestante > 0) {
      return {
        valor: `+${valorFormatado}`,
        cor: 'green',
        status: 'positivo'
      }
    } else if (saldoRestante < 0) {
      return {
        valor: `-${valorFormatado}`,
        cor: 'red',
        status: 'negativo'
      }
    } else {
      return {
        valor: valorFormatado,
        cor: 'gray',
        status: 'zero'
      }
    }
  }

  /**
   * Valida se um valor de adiantamento é válido
   */
  static validarAdiantamento(adiantamento: number): {
    valido: boolean
    erro?: string
  } {
    if (adiantamento < 0) {
      return {
        valido: false,
        erro: 'Adiantamento não pode ser negativo'
      }
    }

    if (adiantamento > 100000) {
      return {
        valido: false,
        erro: 'Adiantamento não pode ser superior a R$ 100.000,00'
      }
    }

    return { valido: true }
  }

  /**
   * Recalcula saldo quando uma despesa é adicionada/removida/editada
   */
  static recalcularSaldoComDespesas(
    adiantamento: number,
    despesas: Array<{ valor: number }>
  ): CalculoAdiantamento {
    const valorTotal = despesas.reduce((total, despesa) => total + despesa.valor, 0)
    return this.calcularSaldo(adiantamento, valorTotal)
  }
}