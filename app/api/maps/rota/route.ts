import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { googleMapsGet, googleStaticMap } from '@/lib/google-maps'

// Imagem do mapa com a rota de carro entre origem e destino, para os detalhes da despesa no app
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

    const direcoes = await googleMapsGet('directions/json', {
      origin: origem,
      destination: destino,
      mode: 'driving',
      language: 'pt-BR',
    })

    const rota = direcoes.routes?.[0]

    if (!rota) {
      return NextResponse.json(
        { error: 'Não foi encontrada uma rota entre origem e destino' },
        { status: 404 }
      )
    }

    const trecho = rota.legs[0]
    const ponto = (p: { lat: number; lng: number }) => `${p.lat},${p.lng}`

    // 640x360 é o máximo da API sem plano premium; scale=2 dobra a resolução para telas de celular
    const imagem = await googleStaticMap({
      size: '640x360',
      scale: '2',
      language: 'pt-BR',
      path: `color:0x3b82f6ff|weight:5|enc:${rota.overview_polyline.points}`,
      markers: [
        `color:green|label:A|${ponto(trecho.start_location)}`,
        `color:red|label:B|${ponto(trecho.end_location)}`,
      ],
    })

    return new NextResponse(imagem, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar o mapa da rota:', error)
    return NextResponse.json(
      { error: 'Não foi possível gerar o mapa da rota' },
      { status: 502 }
    )
  }
}
