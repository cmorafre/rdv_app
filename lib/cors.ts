import { NextResponse } from 'next/server'

// Headers CORS para permitir comunicação com o app mobile
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Mobile-Test, X-Mobile-User-Id, X-Mobile-User-Email',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Resposta OPTIONS para preflight requests
export function corsPreflightResponse() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

// Wrapper para adicionar CORS a qualquer resposta JSON
export function corsResponse(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders(),
      ...init?.headers,
    },
  })
}