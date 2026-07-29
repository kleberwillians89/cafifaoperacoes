import { describe, expect, it, vi } from 'vitest'
import { executeAssistantRequest } from './assistant.service'

const answer = {
  type: 'answer', message: 'Resposta real', headline: null, severity: 'info',
  facts: [], findings: [], references: [], suggested_questions: [],
  context: { intent: 'TODAY', focus: { type: null, id: null, label: null } },
  meta: { response_source: 'openai', fallback_used: false },
}
const response = (status: number, payload: unknown) => new Response(JSON.stringify(payload), {
  status, headers: { 'Content-Type': 'application/json' },
})
const projectId = '11111111-1111-4111-8111-111111111112'
const session = (accessToken: string) => ({ accessToken, expiresAt: Math.floor(Date.now() / 1_000) + 3_600 })

describe('cliente do Assistente CAFIFA', () => {
  it('não chama o endpoint sem sessão', async () => {
    const fetcher = vi.fn()
    await expect(executeAssistantRequest({
      getSession: async () => null, refreshSession: async () => null, fetcher,
    }, projectId, 'Hoje', [], null)).rejects.toThrow('sessão expirou')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('envia o token da sessão somente no Authorization', async () => {
    const fetcher = vi.fn(async (_url, init) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jwt-real')
      expect(JSON.stringify(init)).not.toContain('access_token')
      expect(JSON.parse(String(init?.body)).active_project_id).toBe(projectId)
      return response(200, answer)
    }) as unknown as typeof fetch
    await executeAssistantRequest({
      getSession: async () => session('jwt-real'), refreshSession: async () => null, fetcher,
    }, projectId, 'Hoje', [], null)
  })

  it('renova a sessão uma vez após 401', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response(401, { error: 'Sessão expirada.' }))
      .mockResolvedValueOnce(response(200, answer)) as unknown as typeof fetch
    const refreshSession = vi.fn(async () => session('jwt-renovado'))
    const result = await executeAssistantRequest({
      getSession: async () => session('jwt-antigo'), refreshSession, fetcher,
    }, projectId, 'Hoje', [], null)
    expect(refreshSession).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.message).toBe('Resposta real')
  })

  it('encerra com erro amigável quando o token renovado é recusado', async () => {
    const fetcher = vi.fn(async () => response(401, { error: 'interno' })) as unknown as typeof fetch
    await expect(executeAssistantRequest({
      getSession: async () => session('jwt-antigo'), refreshSession: async () => session('jwt-novo'), fetcher,
    }, projectId, 'Hoje', [], null)).rejects.toThrow('Entre novamente')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
