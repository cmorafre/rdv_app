// Envio de e-mail pelo Resend (API HTTP, sem dependência extra).
// Desligado enquanto RESEND_API_KEY não estiver configurada: nada é enviado e nada quebra.
//
// Variáveis:
//   RESEND_API_KEY   chave da API do Resend (Secret na Vercel)
//   EMAIL_REMETENTE  ex.: "RDV <nao-responda@notificacoes.sysdata.tech>"; o domínio precisa estar
//                    verificado no Resend. Sem ela usa o remetente de teste do Resend, que só
//                    entrega na caixa do dono da conta Resend
//   APP_URL          endereço do site, para os links (padrão: produção)

const REMETENTE_TESTE = 'RDV <onboarding@resend.dev>'

export function emailAtivo(): boolean {
  return !!process.env.RESEND_API_KEY
}

export function urlDoSite(): string {
  return (process.env.APP_URL || 'https://rdv-app-phi.vercel.app').replace(/\/+$/, '')
}

export interface Email {
  para: string
  assunto: string
  html: string
  texto: string
}

// Envia um e-mail; devolve true se o Resend aceitou. Nunca lança: falha de e-mail não pode
// desfazer a ação do usuário
export async function enviarEmail(email: Email): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY
  if (!chave) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_REMETENTE || REMETENTE_TESTE,
        to: [email.para],
        subject: email.assunto,
        html: email.html,
        text: email.texto,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error(`Resend recusou o e-mail para ${email.para}: ${res.status} ${await res.text().catch(() => '')}`)
      return false
    }
    return true
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${email.para}:`, error)
    return false
  }
}

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
