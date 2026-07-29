import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { authenticateRequest, HttpError, type AuthContext } from './_lib/auth.js'
import { CAFIFA_INSTRUCTIONS } from './_lib/cafifa-instructions.js'
import { buildOperationalContext } from './_lib/context-builder.js'
import { routeContext } from './_lib/context-router.js'
import { checkRateLimit } from './_lib/rate-limit.js'
import { AssistantRequestSchema, AssistantResponseSchema, type AssistantResponse } from './_lib/schemas.js'

type Dependencies = {
  authenticate: typeof authenticateRequest
  buildContext: typeof buildOperationalContext
  askModel: (input: { context: unknown; message: string; history: { role: 'user' | 'assistant'; content: string }[] }) => Promise<AssistantResponse>
}

function defaultAskModel() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new HttpError(500, 'Assistente temporariamente indisponível.')
  const client = new OpenAI({ apiKey, timeout: Number(process.env.ASSISTANT_TIMEOUT_MS ?? 25_000), maxRetries: 1 })
  return async ({ context, message, history }: { context: unknown; message: string; history: { role: 'user' | 'assistant'; content: string }[] }) => {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || 'gpt-5',
      input: [
        { role: 'system', content: CAFIFA_INSTRUCTIONS },
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: 'user', content: `Pergunta atual: ${message}\n\nContexto operacional calculado pelo servidor:\n${JSON.stringify(context)}` },
      ],
      text: { format: zodTextFormat(AssistantResponseSchema, 'cafifa_operational_response') },
    })
    if (!response.output_parsed) throw new Error('invalid_model_output')
    return AssistantResponseSchema.parse(response.output_parsed)
  }
}

export function createAssistantHandler(overrides: Partial<Dependencies> = {}) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    const requestId = crypto.randomUUID()
    const startedAt = Date.now()
    let audit: { user_id?: string; project_id?: string; intent?: string } = {}
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.', request_id: requestId })
      const parsed = AssistantRequestSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ error: 'Pedido inválido. Verifique a mensagem enviada.', request_id: requestId })
      const authenticate = overrides.authenticate ?? authenticateRequest
      const auth = await authenticate(req.headers.authorization)
      audit = { user_id: auth.user.id, project_id: auth.project.id }
      const fingerprint = `${parsed.data.message}:${parsed.data.previous?.entity_id ?? ''}`
      const rate = checkRateLimit(auth.user.id, fingerprint)
      if (!rate.allowed) {
        res.setHeader('Retry-After', String(rate.retryAfter))
        return res.status(429).json({ error: 'Limite de consultas atingido. Tente novamente mais tarde.', request_id: requestId })
      }
      const route = routeContext(parsed.data)
      audit.intent = route.intent
      const buildContext = overrides.buildContext ?? buildOperationalContext
      const { context, focus } = await buildContext({ client: auth.client, project: auth.project, userId: auth.user.id, route })
      const askModel = overrides.askModel ?? defaultAskModel()
      const answer = AssistantResponseSchema.parse(await askModel({ context, message: parsed.data.message, history: parsed.data.history.slice(-6) }))
      logRequest({ requestId, ...audit, duration: Date.now() - startedAt, status: 200 })
      return res.status(200).json({ ...answer, request_id: requestId, context: { intent: route.intent, focus } })
    } catch (error) {
      const status = error instanceof HttpError ? error.status : isTimeout(error) ? 504 : 500
      const publicMessage = error instanceof HttpError ? error.message : status === 504
        ? 'A consulta demorou mais que o esperado. Tente novamente.'
        : 'Não foi possível consultar a Central Operacional agora. Tente novamente em alguns instantes.'
      logRequest({ requestId, ...audit, duration: Date.now() - startedAt, status, error: sanitizeError(error) })
      return res.status(status).json({ error: publicMessage, request_id: requestId })
    }
  }
}

function isTimeout(error: unknown) {
  return error instanceof Error && (error.name === 'AbortError' || /timeout|timed out/i.test(error.message))
}
function sanitizeError(error: unknown) {
  if (!(error instanceof Error)) return 'unknown_error'
  if (error instanceof HttpError) return `http_${error.status}`
  if (/invalid_model_output/i.test(error.message)) return 'invalid_model_output'
  if (/timeout|timed out/i.test(error.message)) return 'upstream_timeout'
  return 'internal_error'
}
function logRequest(record: { requestId: string; user_id?: string; project_id?: string; intent?: string; duration: number; status: number; error?: string }) {
  console.info(JSON.stringify({ request_id: record.requestId, user_id: record.user_id, project_id: record.project_id, intent: record.intent, duration_ms: record.duration, status: record.status, error: record.error }))
}

export default createAssistantHandler()
export type { AuthContext }
