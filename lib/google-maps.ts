// Chamadas à API do Google Maps feitas pelo servidor, para o app mobile.
// O site usa a API JavaScript no navegador com NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// esta chave (GOOGLE_MAPS_SERVER_KEY) fica só no servidor.

const BASE_URL = 'https://maps.googleapis.com/maps/api'

export class GoogleMapsError extends Error {}

export async function googleMapsGet(path: string, params: Record<string, string>) {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) {
    throw new GoogleMapsError('GOOGLE_MAPS_SERVER_KEY não configurada')
  }

  const url = `${BASE_URL}/${path}?${new URLSearchParams({ ...params, key })}`
  const response = await fetch(url, { cache: 'no-store' })
  const data = await response.json()

  // OK e ZERO_RESULTS são respostas válidas; o resto é erro de chave, cota ou requisição
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new GoogleMapsError(`${data.status}: ${data.error_message ?? 'sem detalhes'}`)
  }

  return data
}
