"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import { cn } from '@/lib/utils'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string, place?: google.maps.places.PlaceResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Digite o endereço...", 
  className,
  disabled = false
}: AddressAutocompleteProps) {
  const { isLoaded, loadError, google } = useGoogleMaps()
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const [inputValue, setInputValue] = useState(value)
  const [isSettingFromProp, setIsSettingFromProp] = useState(false)

  // Stable onChange callback to prevent unnecessary re-renders
  const stableOnChange = useCallback(onChange, [])

  // Atualizar valor interno quando value prop muda externamente
  useEffect(() => {
    if (value !== inputValue && !isSettingFromProp) {
      setIsSettingFromProp(true)
      setInputValue(value)
      // Clear the flag after a tick to allow normal onChange flow
      setTimeout(() => setIsSettingFromProp(false), 0)
    }
  }, [value, inputValue, isSettingFromProp])

  // Setup autocomplete
  useEffect(() => {
    if (!isLoaded || !google || !inputRef.current || disabled) {
      return
    }

    // Limpar instância anterior se existir
    if (autocompleteRef.current) {
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current)
        listenerRef.current = null
      }
      autocompleteRef.current = null
    }

    // Criar nova instância do autocomplete
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'], // Apenas cidades e regiões administrativas
      componentRestrictions: { country: 'BR' }, // Restringir ao Brasil
      fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types']
    })

    autocompleteRef.current = autocomplete

    // Listener para quando um lugar é selecionado
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (place.formatted_address) {
        setIsSettingFromProp(true)
        setInputValue(place.formatted_address)
        stableOnChange(place.formatted_address, place)
        // Clear the flag after onChange is processed
        setTimeout(() => setIsSettingFromProp(false), 0)
      }
    })

    listenerRef.current = listener

    // Cleanup function
    return () => {
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current)
        listenerRef.current = null
      }
      if (autocompleteRef.current) {
        autocompleteRef.current = null
      }
    }
  }, [isLoaded, google, stableOnChange, disabled])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSettingFromProp) return // Prevent interference during programmatic updates
    
    const newValue = e.target.value
    setInputValue(newValue)
    stableOnChange(newValue)
  }

  if (loadError) {
    return (
      <div className="text-sm text-destructive">
        {loadError}
      </div>
    )
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      placeholder={isLoaded ? placeholder : "Carregando Google Maps..."}
      className={cn(className)}
      disabled={disabled || !isLoaded}
    />
  )
}