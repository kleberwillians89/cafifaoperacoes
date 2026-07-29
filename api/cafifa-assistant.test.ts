import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createAssistantHandler } from './cafifa-assistant.js'
import { HttpError, type AuthContext } from './_lib/auth.js'
import { resetRateLimitsForTests } from './_lib/rate-limit.js'
import type { AssistantResponse, OperationalContext } from './_lib/schemas.js'

const auth = { user: { id: '00000000-0000-0000-0000-000000000001' }, project: { id: '00000000-0000-0000-0000-000000000002' }, client: {} } as unknown as AuthContext
const context = { request_type: 'TODAY' } as unknown as OperationalContext
const answer: AssistantResponse = { type: 'answer', message: 'Resposta baseada nos dados.', headline: null, severity: 'info', facts: [], findings: [], references: [], suggested_questions: [] }
const buildContext = vi.fn(async () => ({ context, focus: { type: null, id: null, label: null } }))
const authenticate = vi.fn(async () => auth)
const askModel = vi.fn(async () => answer)

function execute(body: unknown, authorization = 'Bearer valid', handler = createAssistantHandler({ authenticate, buildContext, askModel })) {
  let status = 200
  let payload: unknown
  const req = { method: 'POST', body, headers: { authorization } } as VercelRequest
  const res = {
    status(code: number) { status = code; return this },
    json(value: unknown) { payload = value; return this },
    setHeader() { return this },
  } as unknown as VercelResponse
  return handler(req, res).then(() => ({ status, payload }))
}

describe('assistant endpoint', () => {
  beforeEach(() => { vi.clearAllMocks(); resetRateLimitsForTests() })
  it('rejeita endpoint sem Authorization', async () => {
    const result = await execute({ message: 'Hoje', history: [], previous: null }, '', createAssistantHandler({ buildContext, askModel }))
    expect(result.status).toBe(401)
  })
  it('rejeita mensagem vazia', async () => expect((await execute({ message: '', history: [], previous: null })).status).toBe(400))
  it('rejeita mensagem maior que 4.000 caracteres', async () => expect((await execute({ message: 'a'.repeat(4_001), history: [], previous: null })).status).toBe(400))
  it('rejeita token inválido', async () => {
    authenticate.mockRejectedValueOnce(new HttpError(401, 'Sessão expirada ou inválida.'))
    expect((await execute({ message: 'Hoje', history: [], previous: null })).status).toBe(401)
  })
  it('rejeita usuário fora do projeto', async () => {
    authenticate.mockRejectedValueOnce(new HttpError(403, 'Usuário sem acesso ativo ao projeto.'))
    expect((await execute({ message: 'Hoje', history: [], previous: null })).status).toBe(403)
  })
  it('processa consulta somente leitura', async () => {
    const result = await execute({ message: 'O que preciso fazer hoje?', history: [], previous: null })
    expect(result.status).toBe(200)
    expect(buildContext).toHaveBeenCalledOnce()
    expect(askModel).toHaveBeenCalledOnce()
  })
  it('rejeita saída inválida da IA', async () => {
    askModel.mockResolvedValueOnce({ message: 'inválida' } as AssistantResponse)
    const result = await execute({ message: 'Resumo executivo', history: [], previous: null })
    expect(result.status).toBe(200)
    expect(JSON.stringify(result.payload)).toContain('temporariamente indisponível')
  })
  it('retorna erro sanitizado quando OPENAI_API_KEY está ausente', async () => {
    const previousKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    const result = await execute({ message: 'Resumo executivo', history: [], previous: null }, 'Bearer valid', createAssistantHandler({ authenticate, buildContext }))
    expect(result.status).toBe(200)
    expect(JSON.stringify(result.payload)).toContain('temporariamente indisponível')
    expect(JSON.stringify(result.payload)).not.toContain('OPENAI_API_KEY')
    if (previousKey) process.env.OPENAI_API_KEY = previousKey
  })
  it('trata timeout sem revelar detalhes', async () => {
    askModel.mockRejectedValueOnce(new Error('Request timed out'))
    const result = await execute({ message: 'Resumo executivo', history: [], previous: null })
    expect(result.status).toBe(200)
    expect(JSON.stringify(result.payload)).toContain('temporariamente indisponível')
    expect(JSON.stringify(result.payload)).not.toContain('Request timed out')
  })
  it('entrega snapshot operacional sem chamar a IA', async () => {
    const result = await execute({ message: 'Resumo de hoje', history: [], previous: null, operational_snapshot: true })
    expect(result.status).toBe(200)
    expect(askModel).not.toHaveBeenCalled()
    expect(JSON.stringify(result.payload)).toContain('Hoje na operação')
  })
  it('aplica limite de requisições', async () => {
    process.env.ASSISTANT_RATE_LIMIT_PER_HOUR = '1'
    expect((await execute({ message: 'Primeira consulta', history: [], previous: null })).status).toBe(200)
    expect((await execute({ message: 'Segunda consulta', history: [], previous: null })).status).toBe(429)
    delete process.env.ASSISTANT_RATE_LIMIT_PER_HOUR
  })
})
