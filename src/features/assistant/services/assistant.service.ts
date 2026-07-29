import { requireSupabase } from '@/features/shared/requireSupabase'
import type { AssistantAnswer, ChatMessage } from '../types'

export async function askAssistant(message: string, history: ChatMessage[], previous: AssistantAnswer['context'] | null, signal?: AbortSignal, operationalSnapshot = false) {
  const auth = requireSupabase().auth
  return executeAssistantRequest({
    getSession: async () => (await auth.getSession()).data.session?.access_token ?? null,
    refreshSession: async () => (await auth.refreshSession()).data.session?.access_token ?? null,
    fetcher: fetch,
  }, message, history, previous, signal, operationalSnapshot)
}

type AssistantDependencies = {
  getSession: () => Promise<string | null>
  refreshSession: () => Promise<string | null>
  fetcher: typeof fetch
}

export async function executeAssistantRequest(dependencies: AssistantDependencies, message: string, history: ChatMessage[], previous: AssistantAnswer['context'] | null, signal?: AbortSignal, operationalSnapshot = false) {
  let token = await dependencies.getSession()
  if (!token) throw new Error('Sua sessão expirou. Entre novamente para consultar o Assistente CAFIFA.')
  const request = (accessToken: string) => dependencies.fetcher('/api/cafifa-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      message,
      operational_snapshot: operationalSnapshot,
      history: history.slice(-6).map((item) => ({ role: item.role, content: item.content.slice(0, 4_000) })),
      previous: previous ? {
        intent: previous.intent,
        entity_type: previous.focus.type,
        entity_id: previous.focus.id,
        entity_label: previous.focus.label,
      } : null,
    }),
    signal,
  })
  let response = await request(token)
  if (response.status === 401) {
    token = await dependencies.refreshSession()
    if (!token) throw new Error('Sua sessão expirou. Entre novamente para continuar.')
    response = await request(token)
  }
  const payload = await response.json() as AssistantAnswer & { error?: string }
  if (!response.ok) {
    if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente para continuar.')
    throw new Error(payload.error || 'Não foi possível consultar o Assistente CAFIFA.')
  }
  return payload
}
