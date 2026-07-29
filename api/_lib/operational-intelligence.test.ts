import { describe, expect, it } from 'vitest'
import type { Area, EvidenceItem, Task } from '../../src/types/database.js'
import { buildTodayOperationalView, calculateAreaHealth, calculateTaskPriorityScore, type IntelligenceInput } from './operational-intelligence.js'

const area = { id: '00000000-0000-0000-0000-000000000001', name: 'Produção' } as Area
const task = (input: Partial<Task>) => ({ id: crypto.randomUUID(), area_id: area.id, title: 'Entrega crítica', status: 'not_started', priority: 'critical', due_date: '2026-07-28', completion_percentage: 0, evidence_required: false, primary_responsible_user_id: null, task_type: 'task', ...input }) as Task
const input = (tasks: Task[], evidences: EvidenceItem[] = []): IntelligenceInput => ({ today: '2026-07-29', nextSevenDays: '2026-08-05', tasks, areas: [area], milestones: [], risks: [], evidences })

describe('operational intelligence', () => {
  it('prioriza atraso crítico sem responsável de forma determinística', () => {
    const result = calculateTaskPriorityScore(task({}), input([]))
    expect(result.score).toBe(87)
    expect(result.reasons).toContain('Prazo vencido')
  })
  it('marca área vermelha por tarefa crítica atrasada', () => {
    const result = calculateAreaHealth(area, input([task({})]))
    expect(result.health).toBe('red')
    expect(result.reasons.join(' ')).toContain('crítica')
  })
  it('limita prioridades do dia a cinco', () => {
    const tasks = Array.from({ length: 8 }, (_, index) => task({ title: `Tarefa ${index}` }))
    expect(buildTodayOperationalView(input(tasks)).top_priorities).toHaveLength(5)
  })
})
