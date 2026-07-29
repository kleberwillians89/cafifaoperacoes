import { describe, expect, it } from 'vitest'
import { routeContext } from './context-router.js'

const request = (message: string) => ({ message, history: [], previous: null })
describe('context router', () => {
  it.each([
    ['O que preciso fazer hoje?', 'TODAY'],
    ['Como está a Produção?', 'AREA'],
    ['Mostre a tarefa de autorização', 'TASK'],
    ['Qual é o próximo marco?', 'MILESTONE'],
    ['Quais riscos ameaçam o Dia D?', 'RISK'],
    ['Monte um resumo executivo.', 'EXECUTIVE'],
  ])('roteia %s como %s', (message, intent) => expect(routeContext(request(message)).intent).toBe(intent))

  it('mantém o foco em follow-up', () => {
    const routed = routeContext({ message: 'E quem é o responsável?', history: [], previous: { intent: 'AREA', entity_type: 'area', entity_id: '00000000-0000-0000-0000-000000000001', entity_label: 'Produção' } })
    expect(routed.intent).toBe('FOLLOW_UP')
    expect(routed.entityHint).toBe('Produção')
  })
})
