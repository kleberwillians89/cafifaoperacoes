import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { StageCard } from '@/components/ui/StageCard'
import { OperationalTaskRow } from '@/components/operations/OperationalTaskRow'
import { assistantEntityRoute } from '@/features/assistant/utils/routes'
import { areaHealth, groupTasks, isOverdueTask, taskOperationalScore } from './utils/operations'
import type { Area, ProjectStage, Task } from '@/types/database'

const audit = { created_at: '2026-07-29T00:00:00Z', updated_at: '2026-07-29T00:00:00Z' }
const task = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(), project_id: 'project', area_id: null, stage_id: null, title: 'Tarefa real',
  description: null, task_type: 'task', status: 'not_started', priority: 'medium',
  original_area_label: null, original_responsible_label: null, original_status_label: null,
  original_priority_label: null, original_due_date_label: null, primary_responsible_user_id: null,
  approver_user_id: null, start_date: null, due_date: null, blocked_reason: null,
  evidence_required: false, approval_required: false, completion_percentage: 0, source_key: null,
  source_page: null, source_section: null, metadata: {}, created_by: null, completed_at: null,
  approved_at: null, archived_at: null, ...audit, ...overrides,
})

describe('motor operacional', () => {
  it('mantém tarefa sem etapa no agrupamento', () => {
    const groups = groupTasks([task()], 'stage', { areas: [], stages: [] }, [])
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Sem etapa definida')
  })

  it('mantém tarefa sem responsável no agrupamento', () => {
    const groups = groupTasks([task()], 'responsible', { areas: [], stages: [] }, [])
    expect(groups[0].label).toBe('Sem responsável')
  })

  it('filtra por área e etapa usando relações reais', () => {
    const area = { id: 'area', name: 'Produção' } as Area
    const stage = { id: 'stage', name: 'Planejamento' } as ProjectStage
    expect(groupTasks([task({ area_id: area.id })], 'area', { areas: [area], stages: [stage] }, [])[0].label).toBe('Produção')
    expect(groupTasks([task({ stage_id: stage.id })], 'stage', { areas: [area], stages: [stage] }, [])[0].label).toBe('Planejamento')
  })

  it('calcula atraso, prioridade e saúde sem IA', () => {
    const critical = task({ priority: 'critical', due_date: '2026-07-20', status: 'blocked' })
    expect(isOverdueTask(critical, '2026-07-29')).toBe(true)
    expect(taskOperationalScore(critical, '2026-07-29')).toBeGreaterThan(90)
    expect(areaHealth([critical], []).level).toBe('red')
  })

  it('expõe estado acessível de expansão e conteúdo real', () => {
    const closed = renderToStaticMarkup(<StageCard id="stage" title="Planejamento" period="Julho" count={1} progress={20} expanded={false} onToggle={() => undefined}/>)
    const open = renderToStaticMarkup(<StageCard id="stage" title="Planejamento" period="Julho" count={1} progress={20} expanded onToggle={() => undefined}><span>Tarefa relacionada</span></StageCard>)
    expect(closed).toContain('aria-expanded="false"')
    expect(closed).not.toContain('Tarefa relacionada')
    expect(open).toContain('aria-expanded="true"')
    expect(open).toContain('Tarefa relacionada')
  })

  it('tarefa renderiza link funcional para o detalhe', () => {
    const item = task()
    const html = renderToStaticMarkup(<MemoryRouter><OperationalTaskRow task={item}/></MemoryRouter>)
    expect(html).toContain(`/app/tarefas/${item.id}`)
    expect(html).toContain('Sem etapa definida')
    expect(html).toContain('Sem responsável')
  })

  it('referências do Assistente abrem as novas entidades', () => {
    expect(assistantEntityRoute('area', 'a')).toBe('/app/areas/a')
    expect(assistantEntityRoute('task', 't')).toBe('/app/tarefas/t')
    expect(assistantEntityRoute('milestone', 'm')).toBe('/app/marcos/m')
    expect(assistantEntityRoute('risk', 'r')).toBe('/app/riscos/r')
  })
})
