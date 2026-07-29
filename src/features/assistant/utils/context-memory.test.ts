import { describe, expect, it } from 'vitest'
import { selectRelevantHistory, updateContextMemory } from './context-memory'
import type { AssistantAnswer, ChatMessage } from '../types'

const message = (role: 'user' | 'assistant', content: string): ChatMessage => ({ id: content, role, content })
const answer = (intent: string, id: string | null): AssistantAnswer => ({
  type: 'answer', message: 'ok', headline: null, severity: 'info', facts: [], findings: [],
  references: [], suggested_questions: [], context: { intent, focus: { type: id ? 'area' : null, id, label: id ? 'Produção' : null } },
})

describe('Context Memory Manager', () => {
  it('mantém somente o bloco recente em perguntas independentes', () => {
    const history = [message('user', 'Produção'), message('assistant', 'Situação'), message('user', 'Mostre os riscos')]
    expect(selectRelevantHistory(history)).toHaveLength(2)
  })

  it('preserva até quatro mensagens quando detecta continuação', () => {
    const history = [message('user', 'Produção'), message('assistant', 'Situação'), message('user', 'E Energia?')]
    expect(selectRelevantHistory(history)).toHaveLength(3)
  })

  it('ignora mensagens que falharam', () => {
    const failed = { ...message('assistant', 'Erro'), failed: true }
    expect(selectRelevantHistory([message('user', 'Produção'), failed])).toEqual([message('user', 'Produção')])
  })

  it('preserva o foco quando a resposta desconhecida não traz entidade', () => {
    const current = answer('AREA', '00000000-0000-0000-0000-000000000001').context
    expect(updateContextMemory(current, answer('UNKNOWN', null))).toBe(current)
  })

  it('atualiza a memória quando existe novo foco', () => {
    expect(updateContextMemory(null, answer('AREA', '00000000-0000-0000-0000-000000000001'))?.focus.label).toBe('Produção')
  })
})
