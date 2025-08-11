"use client"

import { useEffect, useState } from 'react'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MapPin, Route } from 'lucide-react'

interface DistanceCalculatorProps {
  origin: string
  destination: string
  onDistanceCalculated?: (distanceKm: number, duration: string) => void
}

interface DistanceResult {
  distance: string
  distanceKm: number
  duration: string
  status: string
}

export function DistanceCalculator({ 
  origin, 
  destination, 
  onDistanceCalculated 
}: DistanceCalculatorProps) {
  const { isLoaded, google } = useGoogleMaps()
  const [result, setResult] = useState<DistanceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !google || !origin || !destination) {
      return
    }

    calculateDistance()
  }, [isLoaded, google, origin, destination])

  // Função fallback para calcular distância usando coordenadas
  const tryGeocodeDistance = async () => {
    try {
      const geocoder = new google!.maps.Geocoder()
      
      // Geocoding dos dois endereços
      const [originResult, destResult] = await Promise.all([
        new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: origin }, (results, status) => {
            if (status === 'OK' && results) resolve(results)
            else reject(new Error(`Erro ao geocodificar origem: ${status}`))
          })
        }),
        new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: destination }, (results, status) => {
            if (status === 'OK' && results) resolve(results)
            else reject(new Error(`Erro ao geocodificar destino: ${status}`))
          })
        })
      ])

      if (originResult[0] && destResult[0]) {
        const originLatLng = originResult[0].geometry.location
        const destLatLng = destResult[0].geometry.location
        
        // Calcular distância em linha reta usando a fórmula haversine
        const distance = google!.maps.geometry.spherical.computeDistanceBetween(originLatLng, destLatLng)
        const distanceKm = Math.round(distance / 1000)
        
        // Estimar tempo (aproximadamente 60 km/h para viagens entre cidades)
        const estimatedHours = distanceKm / 60
        const hours = Math.floor(estimatedHours)
        const minutes = Math.round((estimatedHours - hours) * 60)
        const duration = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`

        const fallbackResult: DistanceResult = {
          distance: `${distanceKm} km`,
          distanceKm,
          duration: duration,
          status: 'fallback'
        }

        setResult(fallbackResult)
        onDistanceCalculated?.(distanceKm, duration)
      } else {
        throw new Error('Não foi possível encontrar as coordenadas dos endereços')
      }
    } catch (fallbackError) {
      console.error('Erro no fallback de geocoding:', fallbackError)
      throw new Error('Não foi possível calcular a distância entre os pontos informados')
    }
  }

  const calculateDistance = async () => {
    if (!google || !origin || !destination) return

    setLoading(true)
    setError(null)

    try {
      const service = new google.maps.DistanceMatrixService()

      const response = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
        service.getDistanceMatrix({
          origins: [origin],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === 'OK' && response) {
            resolve(response)
          } else {
            reject(new Error(`Erro no cálculo de distância: ${status}`))
          }
        })
      })

      const element = response.rows[0]?.elements[0]

      if (element?.status === 'OK') {
        const distanceKm = Math.round(element.distance!.value / 1000)
        const distanceResult: DistanceResult = {
          distance: element.distance!.text,
          distanceKm,
          duration: element.duration!.text,
          status: 'success'
        }

        setResult(distanceResult)
        onDistanceCalculated?.(distanceKm, element.duration!.text)
      } else {
        // Tratar diferentes tipos de erro
        let errorMessage = ''
        let shouldTryFallback = false
        
        switch (element?.status) {
          case 'NOT_FOUND':
            errorMessage = 'Um dos endereços não foi encontrado. Tente ser mais específico.'
            shouldTryFallback = true
            break
          case 'ZERO_RESULTS':
            errorMessage = 'Não há rotas disponíveis entre estes pontos. Tente endereços diferentes.'
            shouldTryFallback = true
            break
          case 'MAX_WAYPOINTS_EXCEEDED':
            errorMessage = 'Muitos pontos de parada na rota.'
            break
          case 'INVALID_REQUEST':
            errorMessage = 'Solicitação inválida. Verifique os endereços.'
            break
          case 'OVER_QUERY_LIMIT':
            errorMessage = 'Limite de consultas excedido. Tente novamente mais tarde.'
            break
          case 'REQUEST_DENIED':
            errorMessage = 'Acesso negado. Verifique a configuração da API.'
            break
          case 'UNKNOWN_ERROR':
            errorMessage = 'Erro desconhecido no servidor. Tente novamente.'
            break
          default:
            errorMessage = `Erro no cálculo: ${element?.status}`
        }

        if (shouldTryFallback) {
          // Tentar calcular distância aproximada usando coordenadas
          try {
            await tryGeocodeDistance()
          } catch (fallbackError) {
            // Se o geocoding também falhar, mostrar mensagem mais amigável
            console.error('Geocoding também falhou:', fallbackError)
            setError('Não foi possível calcular automaticamente. Digite a distância manualmente no campo abaixo.')
            setResult(null)
          }
        } else {
          throw new Error(errorMessage)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao calcular distância:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!origin || !destination) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>Informe origem e destino para calcular a distância</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Calculando Rota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Calculando distância...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <Route className="h-4 w-4" />
            Cálculo Manual Necessário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 Dica:</p>
            <p className="text-sm text-blue-700">
              Use ferramentas como Google Maps ou Waze para encontrar a distância exata entre 
              <strong> {origin}</strong> e <strong>{destination}</strong>, 
              e digite o valor no campo "Distância (Km)" abaixo.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Informações da Rota
            {result.status === 'fallback' && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Aproximada
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {result.distanceKm} km
              </div>
              <div className="text-xs text-muted-foreground">Distância</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">
                {result.duration}
              </div>
              <div className="text-xs text-muted-foreground">Duração</div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-medium">De:</span>
              <span className="text-muted-foreground">{origin}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-medium">Para:</span>
              <span className="text-muted-foreground">{destination}</span>
            </div>
          </div>
          
          {result.status === 'fallback' && (
            <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200">
              ⚠️ Distância calculada em linha reta. A distância real de condução pode ser diferente.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}