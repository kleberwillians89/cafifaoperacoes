import type { Area, EvidenceItem, Milestone, ProjectRisk, Task } from '../../src/types/database.js'
import type { HealthResult } from './schemas.js'

export type IntelligenceInput = {
  today: string
  nextSevenDays: string
  tasks: Task[]
  areas: Area[]
  milestones: Milestone[]
  risks: ProjectRisk[]
  evidences: EvidenceItem[]
}

const activeTask = (task: Task) => !['completed', 'cancelled'].includes(task.status)
const overdue = (task: Task, today: string) => activeTask(task) && Boolean(task.due_date && task.due_date < today)
const dueSoon = (task: Task, today: string, nextSevenDays: string) => activeTask(task) && Boolean(task.due_date && task.due_date >= today && task.due_date <= nextSevenDays)
const evidenceGap = (task: Task, evidences: EvidenceItem[]) => task.evidence_required && !evidences.some((item) => item.task_id === task.id && Boolean(item.completed_at || item.storage_path || item.external_url))

export function calculateTaskPriorityScore(task: Task, input: IntelligenceInput) {
  let score = { critical: 40, high: 25, medium: 12, low: 4 }[task.priority]
  const reasons: string[] = [`Prioridade ${task.priority}`]
  if (overdue(task, input.today)) { score += 35; reasons.push('Prazo vencido') }
  else if (task.due_date === input.today) { score += 25; reasons.push('Vence hoje') }
  else if (dueSoon(task, input.today, input.nextSevenDays)) { score += 12; reasons.push('Vence nos próximos sete dias') }
  if (task.status === 'blocked') { score += 30; reasons.push('Tarefa bloqueada') }
  if (!task.primary_responsible_user_id) { score += 12; reasons.push('Sem usuário responsável') }
  if (evidenceGap(task, input.evidences)) { score += 15; reasons.push('Evidência obrigatória pendente') }
  if (['event_day', 'milestone', 'checkpoint'].includes(task.task_type)) { score += 15; reasons.push('Criticidade operacional do tipo da tarefa') }
  return { score, reasons }
}

export function calculateAreaHealth(area: Area, input: IntelligenceInput): HealthResult {
  const tasks = input.tasks.filter((task) => task.area_id === area.id)
  const criticalOverdue = tasks.filter((task) => task.priority === 'critical' && overdue(task, input.today))
  const blocked = tasks.filter((task) => task.status === 'blocked')
  const unassigned = tasks.filter((task) => activeTask(task) && !task.primary_responsible_user_id)
  const gaps = tasks.filter((task) => evidenceGap(task, input.evidences))
  const soon = tasks.filter((task) => dueSoon(task, input.today, input.nextSevenDays))
  const progress = Math.round(tasks.reduce((sum, task) => sum + task.completion_percentage, 0) / Math.max(tasks.length, 1))
  const reasons: string[] = []
  if (criticalOverdue.length) reasons.push(`${criticalOverdue.length} tarefa(s) crítica(s) atrasada(s)`)
  if (blocked.length) reasons.push(`${blocked.length} tarefa(s) bloqueada(s)`)
  if (unassigned.length) reasons.push(`${unassigned.length} tarefa(s) ativa(s) sem usuário responsável`)
  if (gaps.length) reasons.push(`${gaps.length} lacuna(s) de evidência obrigatória`)
  if (soon.length) reasons.push(`${soon.length} prazo(s) nos próximos sete dias`)
  if (progress < 40 && tasks.length) reasons.push(`Progresso calculado em ${progress}%`)
  const health = criticalOverdue.length || blocked.some((task) => task.priority === 'critical') ? 'red'
    : unassigned.length || gaps.length || soon.length || (tasks.length > 0 && progress < 40) ? 'yellow' : 'green'
  return {
    health,
    reasons: reasons.length ? reasons : ['Nenhum alerta operacional calculado'],
    facts: [`${tasks.length} tarefas`, `${progress}% de progresso médio`],
    inferences: input.risks.length ? ['Riscos são registrados no projeto, mas o schema não os relaciona diretamente a áreas.'] : [],
  }
}

export function buildAreaOperationalView(area: Area, input: IntelligenceInput) {
  const tasks = input.tasks.filter((task) => task.area_id === area.id)
  const health = calculateAreaHealth(area, input)
  const prioritized = tasks.map((task) => ({ task, ...calculateTaskPriorityScore(task, input) })).sort((a, b) => b.score - a.score)
  return {
    id: area.id, name: area.name, health,
    total_tasks: tasks.length,
    completed: tasks.filter((task) => task.status === 'completed').length,
    in_progress: tasks.filter((task) => task.status === 'in_progress').length,
    pending: tasks.filter((task) => task.status === 'not_started').length,
    overdue: tasks.filter((task) => overdue(task, input.today)).length,
    critical: tasks.filter((task) => task.priority === 'critical' && activeTask(task)).length,
    blocked: tasks.filter((task) => task.status === 'blocked').length,
    progress: Math.round(tasks.reduce((sum, task) => sum + task.completion_percentage, 0) / Math.max(tasks.length, 1)),
    next_due_date: tasks.filter((task) => activeTask(task) && task.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0]?.due_date ?? null,
    operational_responsibles: [...new Set(tasks.map((task) => task.original_responsible_label).filter(Boolean))],
    top_priorities: prioritized.slice(0, 5).map(({ task, score, reasons }) => ({ id: task.id, title: task.title, score, reasons })),
  }
}

export function buildTodayOperationalView(input: IntelligenceInput) {
  const scored = input.tasks.filter(activeTask).map((task) => ({ task, ...calculateTaskPriorityScore(task, input) })).sort((a, b) => b.score - a.score)
  const areaViews = input.areas.map((area) => buildAreaOperationalView(area, input))
  return {
    tasks_due_today: input.tasks.filter((task) => activeTask(task) && task.due_date === input.today).length,
    overdue_tasks: input.tasks.filter((task) => overdue(task, input.today)).length,
    critical_tasks: input.tasks.filter((task) => activeTask(task) && task.priority === 'critical').length,
    blocked_tasks: input.tasks.filter((task) => task.status === 'blocked').length,
    unassigned_tasks: input.tasks.filter((task) => activeTask(task) && !task.primary_responsible_user_id).length,
    evidence_gaps: input.tasks.filter((task) => evidenceGap(task, input.evidences)).length,
    red_areas: areaViews.filter((area) => area.health.health === 'red').length,
    yellow_areas: areaViews.filter((area) => area.health.health === 'yellow').length,
    top_priorities: scored.slice(0, 5).map(({ task, score, reasons }) => ({ id: task.id, title: task.title, due_date: task.due_date, score, reasons })),
  }
}

export function buildExecutiveOperationalView(input: IntelligenceInput) {
  const today = buildTodayOperationalView(input)
  const rank = { red: 0, yellow: 1, green: 2 }
  const areaViews = input.areas.map((area) => buildAreaOperationalView(area, input)).sort((a, b) => rank[a.health.health] - rank[b.health.health])
  const progress = Math.round(input.tasks.reduce((sum, task) => sum + task.completion_percentage, 0) / Math.max(input.tasks.length, 1))
  return { ...today, project_progress: progress, total_tasks: input.tasks.length, area_health: areaViews.slice(0, 12) }
}

export function findOperationalBottlenecks(input: IntelligenceInput) {
  return input.tasks.filter(activeTask).map((task) => ({ task, ...calculateTaskPriorityScore(task, input) }))
    .filter((item) => item.score >= 50).sort((a, b) => b.score - a.score).slice(0, 10)
    .map(({ task, score, reasons }) => ({ type: 'calculation', task_id: task.id, message: `${task.title}: score ${score}`, reasons }))
}

export function findEvidenceGaps(input: IntelligenceInput) {
  return input.tasks.filter((task) => evidenceGap(task, input.evidences))
}

export function findUpcomingMilestoneRisks(input: IntelligenceInput) {
  return input.milestones.filter((milestone) => milestone.status !== 'completed' && milestone.milestone_date && milestone.milestone_date <= input.nextSevenDays)
}
