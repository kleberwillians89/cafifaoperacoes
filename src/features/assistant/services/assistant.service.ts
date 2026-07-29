import { requireSupabase } from '@/features/shared/requireSupabase'
import type { AssistantAnswer, ChatMessage } from '../types'

export async function askAssistant(message: string, history: ChatMessage[], previous: AssistantAnswer['context'] | null, signal?: AbortSignal, operationalSnapshot = false) {
  const { data } = await requireSupabase().auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sua sessão expirou. Entre novamente para consultar o Assistente CAFIFA.')
  const response = await fetch('/api/cafifa-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
  const payload = await response.json() as AssistantAnswer & { error?: string }
  if (!response.ok) throw new Error(payload.error || 'Não foi possível consultar o Assistente CAFIFA.')
  return payload
}
