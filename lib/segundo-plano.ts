import { after } from 'next/server'

// Roda uma tarefa depois de responder (e-mail, push). Na Vercel usa after(), que mantém a função
// viva até terminar. Fora de uma requisição do Next (scripts de teste) roda solto.
export function emSegundoPlano(tarefa: () => Promise<unknown>) {
  const segura = () => tarefa().catch((e) => console.error('Erro em tarefa de segundo plano:', e))
  try {
    after(segura)
  } catch {
    void segura()
  }
}
