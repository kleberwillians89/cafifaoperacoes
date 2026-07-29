import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarDays, UserRound } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Area, Profile, ProjectStage, Task } from '@/types/database'

export function OperationalTaskRow({ task, area, stage, responsible }: {
  task: Task
  area?: Area
  stage?: ProjectStage
  responsible?: Profile
}) {
  return <Link className="operational-task" to={`/app/tarefas/${task.id}`}>
    <div className="operational-task__main">
      <strong>{task.title}</strong>
      <small>{area?.name ?? task.original_area_label ?? 'Sem área'} · {stage?.name ?? 'Sem etapa definida'}</small>
    </div>
    <StatusBadge status={task.status}/>
    <PriorityBadge priority={task.priority}/>
    <span><CalendarDays size={14}/>{task.due_date ? new Date(`${task.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
    <span><UserRound size={14}/>{responsible?.full_name ?? task.original_responsible_label ?? 'Sem responsável'}</span>
    <div className="operational-task__progress"><i style={{ width: `${task.completion_percentage}%` }}/><small>{task.completion_percentage}%</small></div>
    {task.status === 'blocked' && <AlertTriangle className="operational-task__blocked" size={17} aria-label="Tarefa bloqueada"/>}
  </Link>
}
