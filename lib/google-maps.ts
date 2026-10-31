// Chamadas à API do Google Maps feitas pelo servidor, para o app mobile.
// O site usa a API JavaScript no navegador com NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// esta chave (GOOGLE_MAPS_SERVER_KEY) fica só no servidor.

const BASE_URL = 'https://maps.googleapis.com/maps/api'

export class GoogleMapsError extends Error {}

// Valor em lista repete o parâmetro (ex.: um "markers" por marcador no mapa estático)
type Params = Record<string, string | string[]>

function googleMapsUrl(path: string, params: Params) {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) {
    throw new GoogleMapsError('GOOGLE_MAPS_SERVER_KEY não configurada')
  }

  const query = new URLSearchParams({ key })
  for (const [nome, valor] of Object.entries(params)) {
    for (const v of [valor].flat()) query.append(nome, v)
  }

  return `${BASE_URL}/${path}?${query}`
}

export async function googleMapsGet(path: string, params: Params) {
  const response = await fetch(googleMapsUrl(path, params), { cache: 'no-store' })
  const data = await response.json()

  // OK e ZERO_RESULTS são respostas válidas; o resto é erro de chave, cota ou requisição
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new GoogleMapsError(`${data.status}: ${data.error_message ?? 'sem detalhes'}`)
  }

  return data
}

// Imagem PNG do mapa (Maps Static API); responde a imagem, não JSON
export async function googleStaticMap(params: Params) {
  const response = await fetch(googleMapsUrl('staticmap', params), { cache: 'no-store' })

  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
    throw new GoogleMapsError(`staticmap ${response.status}: ${await response.text()}`)
  }

  return response.arrayBuffer()
}
