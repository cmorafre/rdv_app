"use client"

import { useEffect, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface UseGoogleMapsReturn {
  isLoaded: boolean
  loadError: string | null
  google: typeof globalThis.google | null
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [google, setGoogle] = useState<typeof globalThis.google | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setLoadError('Google Maps API key não encontrada')
      console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não está definida')
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    })

    loader
      .load()
      .then((googleMaps) => {
        setGoogle(googleMaps)
        setIsLoaded(true)
        setLoadError(null)
      })
      .catch((error) => {
        console.error('Erro ao carregar Google Maps:', error)
        setLoadError(`Erro ao carregar Google Maps: ${error.message}`)
        setIsLoaded(false)
      })
  }, [])

  return { isLoaded, loadError, google }
}