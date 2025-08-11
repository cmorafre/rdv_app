"use client"

import { useEffect, useRef, useState } from 'react'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Route, MapPin } from 'lucide-react'

interface RouteMapProps {
  origin: string
  destination: string
  className?: string
}

export function RouteMap({ origin, destination, className }: RouteMapProps) {
  const { isLoaded, loadError, google } = useGoogleMaps()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current || !origin || !destination) {
      return
    }

    // Inicializar mapa se ainda não foi criado
    if (!mapInstanceRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        zoom: 10,
        center: { lat: -14.235, lng: -51.925 }, // Centro do Brasil
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map
      directionsServiceRef.current = new google.maps.DirectionsService()
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        draggable: false,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        },
        markerOptions: {
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        }
      })

      directionsRendererRef.current.setMap(map)
    }

    // Calcular e mostrar rota
    calculateRoute()
  }, [isLoaded, google, origin, destination])

  const calculateRoute = async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !mapInstanceRef.current) {
      return
    }

    setIsLoadingRoute(true)
    setRouteError(null)

    try {
      const request: google.maps.DirectionsRequest = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }

      const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsServiceRef.current!.route(request, (result, status) => {
          if (status === 'OK' && result) {
            resolve(result)
          } else {
            reject(new Error(`Erro ao calcular rota: ${status}`))
          }
        })
      })

      // Mostrar a rota no mapa
      directionsRendererRef.current.setDirections(response)

      // Ajustar zoom para mostrar toda a rota
      const bounds = new google!.maps.LatLngBounds()
      const route = response.routes[0]
      
      route.legs.forEach(leg => {
        bounds.extend(leg.start_location)
        bounds.extend(leg.end_location)
      })

      mapInstanceRef.current.fitBounds(bounds)
      
      // Adicionar um pouco de padding
      setTimeout(() => {
        mapInstanceRef.current!.panBy(0, 0)
      }, 100)

    } catch (error) {
      console.error('Erro ao calcular rota:', error)
      setRouteError('Não foi possível calcular a rota entre os pontos informados')
      
      // Como fallback, mostrar marcadores nos pontos
      showMarkersOnly()
    } finally {
      setIsLoadingRoute(false)
    }
  }

  const showMarkersOnly = async () => {
    if (!google || !mapInstanceRef.current) return

    try {
      const geocoder = new google.maps.Geocoder()
      
      const [originResult, destResult] = await Promise.all([
        new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: origin }, (results, status) => {
            if (status === 'OK' && results) resolve(results)
            else reject(new Error(`Erro ao localizar origem: ${status}`))
          })
        }),
        new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: destination }, (results, status) => {
            if (status === 'OK' && results) resolve(results)
            else reject(new Error(`Erro ao localizar destino: ${status}`))
          })
        })
      ])

      // Criar marcadores
      const originMarker = new google.maps.Marker({
        position: originResult[0].geometry.location,
        map: mapInstanceRef.current,
        title: `Origem: ${origin}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      const destMarker = new google.maps.Marker({
        position: destResult[0].geometry.location,
        map: mapInstanceRef.current,
        title: `Destino: ${destination}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      // Ajustar zoom para mostrar ambos os marcadores
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(originResult[0].geometry.location)
      bounds.extend(destResult[0].geometry.location)
      mapInstanceRef.current.fitBounds(bounds)

    } catch (error) {
      console.error('Erro ao mostrar marcadores:', error)
    }
  }

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm text-destructive">{loadError}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!origin || !destination) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>Origem e destino necessários para mostrar o mapa</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-4 w-4" />
          Trajeto da Viagem
          {isLoadingRoute && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-medium">🟢 Origem:</span>
              <span className="text-muted-foreground">{origin}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-medium">🔴 Destino:</span>
              <span className="text-muted-foreground">{destination}</span>
            </div>
          </div>

          <div 
            ref={mapRef}
            className="w-full h-64 md:h-80 bg-gray-100 rounded-lg border"
            style={{ minHeight: '250px' }}
          />

          {routeError && (
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="font-medium mb-1">⚠️ Rota não disponível</p>
              <p>{routeError}</p>
              <p className="mt-2 text-xs">
                Mostrando apenas os pontos de origem e destino no mapa.
              </p>
            </div>
          )}

          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Carregando mapa...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}