import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { googleMapsGet } from '@/lib/google-maps'

// Distância de carro entre origem e destino, como a calculadora do site
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const origem = searchParams.get('origem')?.trim()
    const destino = searchParams.get('destino')?.trim()

    if (!origem || !destino) {
      return NextResponse.json(
        { error: 'Origem e destino são obrigatórios' },
        { status: 400 }
      )
    }

    const data = await googleMapsGet('distancematrix/json', {
      origins: origem,
      destinations: destino,
      mode: 'driving',
      units: 'metric',
      language: 'pt-BR',
    })

    const element = data.rows?.[0]?.elements?.[0]

    if (element?.status !== 'OK') {
      return NextResponse.json(
        { error: 'Não foi encontrada uma rota entre origem e destino' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      distanciaKm: Math.round(element.distance.value / 1000),
      duracao: element.duration.text,
    })
  } catch (error) {
    console.error('Erro no cálculo de distância do Google Maps:', error)
    return NextResponse.json(
      { error: 'Não foi possível calcular a distância' },
      { status: 502 }
    )
  }
}
