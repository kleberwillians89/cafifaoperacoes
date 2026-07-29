import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export function StageCard({ id, title, period, count, progress, expanded, onToggle, children }: { id: string; title: string; period: string; count: number; progress: number; expanded: boolean; onToggle: () => void; children?: ReactNode }) {
  return (
    <article className={`stage-card ${expanded ? 'is-expanded' : ''}`}>
      <div className="stage-card__summary"><div className="stage-card__content">
        <span className="stage-card__period"><CalendarDays size={15} /> {period}</span>
        <h2>{title}</h2>
        <p>{count} tarefas nesta etapa</p>
        <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="stage-card__score"><strong>{progress}%</strong><span>concluído</span></div>
      <button aria-label={`${expanded ? 'Recolher' : 'Expandir'} ${title}`} aria-expanded={expanded} aria-controls={`stage-content-${id}`} onClick={onToggle}>{expanded ? <ChevronDown size={20}/> : <ChevronRight size={20} />}</button></div>
      {expanded && <div className="stage-card__tasks" id={`stage-content-${id}`}>{children}</div>}
    </article>
  )
}
