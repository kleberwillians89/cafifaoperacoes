import type { TaskStatus } from '@/types/ui'

const labels: Record<TaskStatus, string> = {
  not_started: 'Não iniciada',
  in_progress: 'Em andamento',
  waiting_external: 'Aguardando terceiros',
  blocked: 'Bloqueada',
  under_review: 'Em revisão',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge status-${status}`}>{labels[status]}</span>
}
