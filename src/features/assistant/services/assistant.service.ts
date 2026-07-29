import { requireSupabase } from '@/features/shared/requireSupabase'
import { AssistantAnswerSchema, AssistantRequestSchema, type AssistantAnswer, type ChatMessage } from '../types'

export const browserFetch: typeof globalThis.fetch = (input, init) => globalThis.fetch(input, init)

export async function askAssistant(projectId: string, message: string, history: ChatMessage[], previous: AssistantAnswer['context'] | null, signal?: AbortSignal, operationalSnapshot = false) {
  const auth = requireSupabase().auth
  return executeAssistantRequest({
    getSession: async () => {
      const { data, error } = await auth.getSession()
      if (error) throw new AssistantClientError('ASSISTANT_SESSION_INVALID', 'Não foi possível validar sua sessão.')
      return data.session ? { accessToken: data.session.access_token, expiresAt: data.session.expires_at ?? null } : null
    },
    refreshSession: async () => {
      const { data, error } = await auth.refreshSession()
      if (error) return null
      return data.session ? { accessToken: data.session.access_token, expiresAt: data.session.expires_at ?? null } : null
    },
    fetcher: browserFetch,
  }, projectId, message, history, previous, signal, operationalSnapshot)
}

type SessionToken = { accessToken: string; expiresAt: number | null }
type AssistantDependencies = {
  getSession: () => Promise<SessionToken | null>
  refreshSession: () => Promise<SessionToken | null>
  fetcher: typeof fetch
}

export class AssistantClientError extends Error {
  constructor(public code: string, message: string) { super(message) }
}

export async function executeAssistantRequest(dependencies: AssistantDependencies, projectId: string, message: string, history: ChatMessage[], previous: AssistantAnswer['context'] | null, signal?: AbortSignal, operationalSnapshot = false) {
  let session = await dependencies.getSession()
  if (!session?.accessToken) throw new AssistantClientError('ASSISTANT_SESSION_MISSING', 'Sua sessão expirou. Entre novamente.')
  const now = Math.floor(Date.now() / 1_000)
  if (session.expiresAt && session.expiresAt <= now + 30) session = await dependencies.refreshSession()
  if (!session?.accessToken) throw new AssistantClientError('ASSISTANT_SESSION_INVALID', 'Sua sessão expirou. Entre novamente.')
  const body = AssistantRequestSchema.parse({
    message,
    operational_snapshot: operationalSnapshot,
    active_project_id: projectId,
    history: history.slice(-6).map((item) => ({ role: item.role, content: item.content.slice(0, 4_000) })),
    previous: previous ? {
      intent: previous.intent,
      entity_type: previous.focus.type,
      entity_id: previous.focus.id,
      entity_label: previous.focus.label,
    } : null,
  })
  const request = (accessToken: string) => dependencies.fetcher('/api/cafifa-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
    signal,
  })
  let response = await request(session.accessToken)
  if (response.status === 401) {
    session = await dependencies.refreshSession()
    if (!session?.accessToken) throw new AssistantClientError('ASSISTANT_SESSION_INVALID', 'Sua sessão expirou. Entre novamente.')
    response = await request(session.accessToken)
  }
  const payload = await response.json() as AssistantAnswer & { error?: string; code?: string }
  if (!response.ok) {
    if (response.status === 401) throw new AssistantClientError('ASSISTANT_SESSION_INVALID', 'Sua sessão expirou. Entre novamente.')
    if (response.status === 403) throw new AssistantClientError(payload.code ?? 'ASSISTANT_PROJECT_ACCESS_DENIED', 'Seu usuário não possui acesso ao projeto selecionado.')
    throw new AssistantClientError(payload.code ?? 'ASSISTANT_REQUEST_FAILED', payload.error || 'Não foi possível consultar o Assistente CAFIFA.')
  }
  const parsed = AssistantAnswerSchema.safeParse(payload)
  if (!parsed.success) throw new AssistantClientError('ASSISTANT_RESPONSE_INVALID', 'A resposta do Assistente não pôde ser validada.')
  return parsed.data
}
