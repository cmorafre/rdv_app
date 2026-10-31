import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { googleMapsGet } from '@/lib/google-maps'

// Sugestões de cidades do Brasil, como o autocomplete do site
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const sessionToken = searchParams.get('sessionToken')

    if (q.length < 2) {
      return NextResponse.json([])
    }

    const data = await googleMapsGet('place/autocomplete/json', {
      input: q,
      types: '(cities)',
      components: 'country:br',
      language: 'pt-BR',
      ...(sessionToken ? { sessiontoken: sessionToken } : {}),
    })

    const sugestoes = (data.predictions ?? []).map(
      (p: { place_id: string; description: string }) => ({
        placeId: p.place_id,
        descricao: p.description,
      })
    )

    return NextResponse.json(sugestoes)
  } catch (error) {
    console.error('Erro no autocomplete do Google Maps:', error)
    return NextResponse.json(
      { error: 'Não foi possível buscar as cidades' },
      { status: 502 }
    )
  }
}
