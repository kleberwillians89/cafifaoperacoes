import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { authenticateRequest, HttpError, type AuthContext } from './_lib/auth.js'
import { CAFIFA_INSTRUCTIONS } from './_lib/cafifa-instructions.js'
import { buildOperationalContext } from './_lib/context-builder.js'
import { routeContext } from './_lib/context-router.js'
import { checkRateLimit } from './_lib/rate-limit.js'
import { AssistantRequestSchema, AssistantResponseSchema, type AssistantResponse, type OperationalContext } from './_lib/schemas.js'

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
    logRuntimeConfiguration()
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
      let answer: AssistantResponse
      if (parsed.data.operational_snapshot) {
        answer = buildOperationalFallback(context, false)
      } else {
        try {
          const askModel = overrides.askModel ?? defaultAskModel()
          answer = AssistantResponseSchema.parse(await askModel({ context, message: parsed.data.message, history: parsed.data.history.slice(-6) }))
        } catch (error) {
          console.info(JSON.stringify({ request_id: requestId, status: 'ai_fallback', error: sanitizeError(error) }))
          answer = buildOperationalFallback(context, true)
        }
      }
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

export function buildOperationalFallback(context: OperationalContext, degraded: boolean): AssistantResponse {
  const date = asRecord(context.current_date)
  const summary = asRecord(context.summary)
  const priorities = Array.isArray(summary.top_priorities) ? summary.top_priorities.slice(0, 5).map(asRecord) : []
  const milestones = Array.isArray(context.milestones) ? context.milestones : []
  const nextMilestone = milestones[0]
  const facts = [
    { label: 'Data da operação', value: String(date.date_label ?? date.iso_date ?? 'Não disponível') },
    { label: 'Dias para o evento', value: String(date.days_until_event ?? 'Não disponível') },
    { label: 'Tarefas de hoje', value: String(summary.tasks_due_today ?? 0) },
    { label: 'Tarefas atrasadas', value: String(summary.overdue_tasks ?? 0) },
    { label: 'Tarefas críticas', value: String(summary.critical_tasks ?? 0) },
    { label: 'Áreas em alerta', value: String(Number(summary.red_areas ?? 0) + Number(summary.yellow_areas ?? 0)) },
    { label: 'Próximo marco', value: String(nextMilestone?.title ?? 'Nenhum marco próximo visível') },
  ]
  const priorityText = priorities.length
    ? priorities.map((item, index) => `${index + 1}. ${String(item.title ?? 'Tarefa')} — score ${String(item.score ?? 0)}`).join('\n')
    : 'Nenhuma ação prioritária foi identificada nos dados visíveis.'
  return {
    type: 'answer',
    headline: degraded ? 'Dados operacionais atualizados' : 'Hoje na operação',
    severity: Number(summary.overdue_tasks ?? 0) || Number(summary.red_areas ?? 0) ? 'attention' : 'info',
    message: degraded
      ? `A análise inteligente está temporariamente indisponível, mas os dados operacionais atualizados estão disponíveis abaixo.\n\nPrioridades calculadas pelo servidor:\n${priorityText}`
      : `Visão objetiva de ${String(date.weekday ?? 'hoje')}, com prioridades calculadas pelo servidor.\n\nAções prioritárias:\n${priorityText}`,
    facts,
    findings: [
      { type: 'calculation', message: 'A ordenação das prioridades usa o score determinístico da Central Operacional.' },
      ...(degraded ? [{ type: 'fact' as const, message: 'A resposta inteligente não estava disponível; nenhum dado foi alterado.' }] : []),
    ],
    references: priorities.flatMap((item) => typeof item.id === 'string' ? [{
      entity_type: 'task' as const,
      entity_id: item.id,
      label: String(item.title ?? 'Abrir tarefa'),
    }] : []),
    suggested_questions: ['O que está atrasado?', 'Como está a Produção?', 'Monte um resumo executivo.'],
  }
}

function isTimeout(error: unknown) {
  return error instanceof Error && (error.name === 'AbortError' || /timeout|timed out/i.test(error.message))
}
function logRuntimeConfiguration() {
  console.info(JSON.stringify({
    supabase_url_configured: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    supabase_anon_configured: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    openai_configured: Boolean(process.env.OPENAI_API_KEY),
    model_configured: Boolean(process.env.OPENAI_MODEL),
  }))
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
