import type { Area, EvidenceItem, Profile, ProjectStage, Task } from '@/types/database'

export const isActiveTask = (task: Task) => !['completed', 'cancelled'].includes(task.status)
export const isOverdueTask = (task: Task, today = new Date().toISOString().slice(0, 10)) =>
  isActiveTask(task) && Boolean(task.due_date && task.due_date < today)

export function taskOperationalScore(task: Task, today = new Date().toISOString().slice(0, 10)) {
  let score = { critical: 40, high: 25, medium: 12, low: 4 }[task.priority]
  if (isOverdueTask(task, today)) score += 35
  else if (task.due_date === today) score += 25
  else if (task.due_date && task.due_date > today) score += 8
  if (task.status === 'blocked') score += 30
  if (!task.primary_responsible_user_id) score += 12
  if (task.evidence_required) score += 10
  return score
}

export function areaHealth(tasks: Task[], evidence: EvidenceItem[]) {
  tasks = Array.isArray(tasks) ? tasks : []
  evidence = Array.isArray(evidence) ? evidence : []
  const overdue = tasks.filter((task) => isOverdueTask(task))
  const criticalOverdue = overdue.filter((task) => task.priority === 'critical')
  const blocked = tasks.filter((task) => task.status === 'blocked')
  const unassigned = tasks.filter((task) => isActiveTask(task) && !task.primary_responsible_user_id)
  const evidencePending = tasks.filter((task) => task.evidence_required
    && !evidence.some((item) => item.task_id === task.id && Boolean(item.completed_at || item.storage_path || item.external_url)))
  const reasons = [
    criticalOverdue.length ? `${criticalOverdue.length} tarefa(s) crítica(s) atrasada(s)` : '',
    blocked.length ? `${blocked.length} tarefa(s) bloqueada(s)` : '',
    unassigned.length ? `${unassigned.length} tarefa(s) sem usuário responsável` : '',
    evidencePending.length ? `${evidencePending.length} evidência(s) obrigatória(s) pendente(s)` : '',
  ].filter(Boolean)
  return {
    level: criticalOverdue.length || blocked.some((task) => task.priority === 'critical') ? 'red' as const
      : reasons.length ? 'yellow' as const : 'green' as const,
    reasons: reasons.length ? reasons : ['Nenhum alerta operacional calculado'],
    overdue: overdue.length,
    critical: tasks.filter((task) => isActiveTask(task) && task.priority === 'critical').length,
    blocked: blocked.length,
    unassigned: unassigned.length,
    evidencePending: evidencePending.length,
  }
}

export function groupTasks(tasks: Task[], group: string, data: { areas: Area[]; stages: ProjectStage[] }, members: { user_id: string; profile: Profile }[] | undefined) {
  const labels = new Map<string, Task[]>()
  tasks.forEach((task) => {
    const label = group === 'area' ? data.areas.find((item) => item.id === task.area_id)?.name ?? 'Sem área'
      : group === 'stage' ? data.stages.find((item) => item.id === task.stage_id)?.name ?? 'Sem etapa definida'
        : group === 'responsible' ? members?.find((item) => item.user_id === task.primary_responsible_user_id)?.profile.full_name ?? task.original_responsible_label ?? 'Sem responsável'
          : task.status.replaceAll('_', ' ')
    labels.set(label, [...(labels.get(label) ?? []), task])
  })
  return [...labels.entries()].map(([label, groupedTasks]) => ({ label, tasks: groupedTasks }))
}
