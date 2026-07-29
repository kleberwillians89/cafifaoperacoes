import { describe, expect, it } from 'vitest'
import { buildOperationalTimeline, formatOperationalDate, isValidDateValue, normalizeCentralData } from './utils/operations-center'
import type { Milestone, Task } from '@/types/database'

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'task', project_id: 'project', area_id: null, stage_id: null, title: 'Entrega',
  description: null, task_type: 'task', status: 'not_started', priority: 'medium',
  original_area_label: null, original_responsible_label: null, original_status_label: null,
  original_priority_label: null, original_due_date_label: null, primary_responsible_user_id: null,
  approver_user_id: null, start_date: null, due_date: null, blocked_reason: null,
  evidence_required: false, approval_required: false, completion_percentage: 0, source_key: null,
  source_page: null, source_section: null, metadata: {}, created_by: null, completed_at: null,
  approved_at: null, archived_at: null, created_at: '', updated_at: '', ...overrides,
})
const milestone = (overrides: Partial<Milestone> = {}): Milestone => ({
  id: 'milestone', project_id: 'project', stage_id: null, title: 'Marco', description: null,
  milestone_date: null, original_date_label: null, priority: 'critical', status: 'not_started',
  source_key: null, metadata: {}, created_at: '', updated_at: '', ...overrides,
})

describe('estabilidade da Central Operacional', () => {
  it('normaliza respostas nulas para arrays vazios', () => {
    const data = normalizeCentralData({ tasks: null, areas: null, history: null })
    expect(data.tasks).toEqual([])
    expect(data.areas).toEqual([])
    expect(data.history).toEqual([])
  })
  it('descarta registros parciais sem id', () => {
    expect(normalizeCentralData({ tasks: [null as unknown as Task] }).tasks).toEqual([])
  })
  it('aceita tarefa sem área, etapa ou responsável', () => {
    expect(normalizeCentralData({ tasks: [task()] }).tasks).toHaveLength(1)
  })
  it('rejeita data inválida sem lançar exceção', () => {
    expect(isValidDateValue('2026-99-99')).toBe(false)
    expect(formatOperationalDate('inválida')).toBe('Sem data')
  })
  it('renderiza fallback para data nula', () => expect(formatOperationalDate(null)).toBe('Sem data'))
  it('cria timeline vazia sem marcos ou tarefas', () => {
    expect(buildOperationalTimeline({ tasks: [], milestones: [] }, '2026-07-29', '2026-08-05')).toEqual([])
  })
  it('ignora marcos sem data', () => {
    expect(buildOperationalTimeline({ tasks: [], milestones: [milestone()] }, '2026-07-29', '2026-08-05')).toEqual([])
  })
  it('ignora tarefas concluídas no período', () => {
    expect(buildOperationalTimeline({ tasks: [task({ status: 'completed', due_date: '2026-08-01' })], milestones: [] }, '2026-07-29', '2026-08-05')).toEqual([])
  })
  it('ordena tarefa e marco por data', () => {
    const result = buildOperationalTimeline({ tasks: [task({ due_date: '2026-08-02' })], milestones: [milestone({ milestone_date: '2026-08-01' })] }, '2026-07-29', '2026-08-05')
    expect(result.map((item) => item.type)).toEqual(['Marco', 'Tarefa'])
  })
  it('não altera o formato durante atualizações equivalentes', () => {
    expect(Object.keys(normalizeCentralData({}))).toEqual(Object.keys(normalizeCentralData({ tasks: [], milestones: [] })))
  })
})
