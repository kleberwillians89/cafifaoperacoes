import type { Area, ChecklistItem, EvidenceItem, Milestone, ProjectRisk, ProjectStage, Task, TaskHistory } from '@/types/database'

export type CentralData = {
  tasks: Task[]
  areas: Area[]
  stages: ProjectStage[]
  milestones: Milestone[]
  risks: ProjectRisk[]
  evidence: EvidenceItem[]
  checklist: ChecklistItem[]
  history: TaskHistory[]
}

export const asArray = <T>(value: T[] | null | undefined): T[] => Array.isArray(value) ? value : []
export const isValidDateValue = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime())

export function normalizeCentralData(input: {
  tasks?: Task[] | null; areas?: Area[] | null; stages?: ProjectStage[] | null
  milestones?: Milestone[] | null; risks?: ProjectRisk[] | null; evidence?: EvidenceItem[] | null
  checklist?: ChecklistItem[] | null; history?: TaskHistory[] | null
}): CentralData {
  return {
    tasks: asArray(input.tasks).filter((item): item is Task => Boolean(item && typeof item.id === 'string')),
    areas: asArray(input.areas).filter((item): item is Area => Boolean(item && typeof item.id === 'string')),
    stages: asArray(input.stages).filter((item): item is ProjectStage => Boolean(item && typeof item.id === 'string')),
    milestones: asArray(input.milestones).filter((item): item is Milestone => Boolean(item && typeof item.id === 'string')),
    risks: asArray(input.risks).filter((item): item is ProjectRisk => Boolean(item && typeof item.id === 'string')),
    evidence: asArray(input.evidence).filter((item): item is EvidenceItem => Boolean(item && typeof item.id === 'string')),
    checklist: asArray(input.checklist).filter((item): item is ChecklistItem => Boolean(item && typeof item.id === 'string')),
    history: asArray(input.history).filter((item): item is TaskHistory => Boolean(item && typeof item.id === 'string')),
  }
}

export function formatOperationalDate(value: unknown) {
  if (!isValidDateValue(value)) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))
}

export function buildOperationalTimeline(data: Pick<CentralData, 'tasks' | 'milestones'>, today: string, endIso: string) {
  const active = (task: Task) => !['completed', 'cancelled'].includes(task.status)
  const tasks = data.tasks
    .filter((task) => active(task) && isValidDateValue(task.due_date) && task.due_date >= today && task.due_date <= endIso)
    .map((item) => ({ id: item.id, type: 'Tarefa' as const, title: item.title || 'Tarefa sem título', date: item.due_date!, route: `/app/tarefas/${item.id}` }))
  const milestones = data.milestones
    .filter((item) => isValidDateValue(item.milestone_date))
    .map((item) => ({ id: item.id, type: 'Marco' as const, title: item.title || 'Marco sem título', date: item.milestone_date!, route: `/app/marcos/${item.id}` }))
  return [...milestones, ...tasks].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 18)
}
