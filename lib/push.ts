// Push no celular pelo serviço do Expo (que entrega pelo FCM no Android).
// Não precisa de chave aqui: a credencial do Firebase fica no projeto do Expo.
// Opcional: EXPO_ACCESS_TOKEN, se o "enhanced security" do push for ligado no Expo.
import { prisma } from './db'
import type { Aviso } from './notificacoes'

const URL_EXPO_PUSH = 'https://exp.host/--/api/v2/push/send'
const LOTE = 100 // limite do Expo por requisição

// Formato do token gerado por expo-notifications
export function tokenExpoValido(token: unknown): token is string {
  return typeof token === 'string' && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token) && token.length <= 255
}

interface Ticket {
  status: 'ok' | 'error'
  message?: string
  details?: { error?: string }
}

// Manda o aviso aos celulares dos destinatários ativos. Devolve quantos o Expo aceitou.
// Tokens que o Expo diz não existirem mais (app desinstalado) são apagados. Nunca lança.
export async function enviarAvisoPorPush(aviso: Aviso): Promise<number> {
  try {
    const dispositivos = await prisma.dispositivo.findMany({
      where: { usuarioId: { in: aviso.destinatarios }, usuario: { ativo: true } },
      select: { token: true },
    })
    if (dispositivos.length === 0) return 0

    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
    if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`

    let aceitos = 0
    const invalidos: string[] = []
    for (let i = 0; i < dispositivos.length; i += LOTE) {
      const lote = dispositivos.slice(i, i + LOTE)
      const res = await fetch(URL_EXPO_PUSH, {
        method: 'POST',
        headers,
        body: JSON.stringify(
          lote.map((d) => ({
            to: d.token,
            title: aviso.titulo,
            body: aviso.mensagem,
            data: { relatorioId: aviso.relatorioId, tipo: aviso.tipo },
            sound: 'default',
            channelId: 'default',
            priority: 'high',
          }))
        ),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        console.error(`Expo Push recusou o envio: ${res.status} ${await res.text().catch(() => '')}`)
        continue
      }
      const { data } = (await res.json()) as { data?: Ticket[] }
      ;(data ?? []).forEach((ticket, j) => {
        if (ticket.status === 'ok') aceitos++
        else if (ticket.details?.error === 'DeviceNotRegistered') invalidos.push(lote[j].token)
        else console.error(`Push não enviado: ${ticket.message ?? ticket.details?.error}`)
      })
    }

    if (invalidos.length > 0) {
      await prisma.dispositivo.deleteMany({ where: { token: { in: invalidos } } })
    }
    return aceitos
  } catch (error) {
    console.error('Erro ao enviar push:', error)
    return 0
  }
}
