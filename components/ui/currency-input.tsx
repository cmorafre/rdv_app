"use client"

import { forwardRef, useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("")
    const inputRef = useRef<HTMLInputElement | null>(null)

    // Formatar apenas para exibição inicial
    const formatDisplayValue = (rawValue: string): string => {
      if (!rawValue) return ""

      // Se tem vírgula, trata como decimal
      if (rawValue.includes(',')) {
        const [inteiros, decimais] = rawValue.split(',')
        const inteiroNumber = parseInt(inteiros.replace(/\D/g, '')) || 0
        const decimaisPart = decimais.substring(0, 2)

        const formatted = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(parseFloat(`${inteiroNumber}.${decimaisPart.padEnd(2, '0')}`))

        return formatted
      }

      // Se não tem vírgula, trata como inteiro
      const numero = parseInt(rawValue.replace(/\D/g, '')) || 0
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numero)
    }

    // Atualizar display quando value prop mudar (apenas no carregamento inicial)
    useEffect(() => {
      if (value && !displayValue) {
        const formatted = formatDisplayValue(value)
        setDisplayValue(formatted)
      }
    }, [value, displayValue])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const cursorPosition = e.target.selectionStart

      // Se campo está vazio, permite
      if (!inputValue) {
        setDisplayValue("")
        if (onChange) {
          onChange("")
        }
        return
      }

      // Remove tudo exceto números e vírgula
      const cleanValue = inputValue.replace(/[^\d,]/g, '')

      // Permite apenas uma vírgula
      const parts = cleanValue.split(',')
      let finalValue = parts[0]
      if (parts.length > 1) {
        // Limita decimais a 2 dígitos
        finalValue = `${parts[0]},${parts[1].substring(0, 2)}`
      }

      // Atualiza o display com o valor limpo (sem formatação durante a digitação)
      setDisplayValue(finalValue)

      // Preserva a posição do cursor
      setTimeout(() => {
        if (inputRef.current && cursorPosition !== null) {
          const newPosition = Math.min(cursorPosition, finalValue.length)
          inputRef.current.setSelectionRange(newPosition, newPosition)
        }
      }, 0)

      if (onChange) {
        onChange(finalValue)
      }
    }

    const handleBlur = () => {
      // Apenas formata quando sai do campo
      if (displayValue) {
        const formatted = formatDisplayValue(displayValue)
        setDisplayValue(formatted)
      }
    }

    const handleFocus = () => {
      // Volta para valor não formatado quando foca
      if (displayValue) {
        const cleanValue = displayValue.replace(/[^\d,]/g, '')
        setDisplayValue(cleanValue)
      }
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
          R$
        </span>
        <Input
          {...props}
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={cn("pl-10", className)}
          placeholder="0,00"
        />
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }