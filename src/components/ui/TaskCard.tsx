import { CalendarDays, MapPin } from 'lucide-react'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'
import { UserAvatar } from './UserAvatar'
import type { TaskPriority, TaskStatus } from '@/types/ui'

type Props = { title: string; area: string; dueDate: string; responsible?: string; status: TaskStatus; priority: TaskPriority }

export function TaskCard({ title, area, dueDate, responsible, status, priority }: Props) {
  return (
    <article className="task-card">
      <div className="task-card__badges"><StatusBadge status={status} /><PriorityBadge priority={priority} /></div>
      <h3>{title}</h3>
      <p><MapPin size={15} /> {area}</p>
      <footer><span><CalendarDays size={15} /> {dueDate}</span><UserAvatar name={responsible ?? 'Sem responsável'} size="small" /></footer>
    </article>
  )
}
