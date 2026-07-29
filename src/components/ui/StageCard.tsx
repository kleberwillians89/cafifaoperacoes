import { CalendarDays, ChevronRight } from 'lucide-react'

export function StageCard({ title, period, count, progress }: { title: string; period: string; count: number; progress: number }) {
  return (
    <article className="stage-card">
      <div className="stage-card__content">
        <span className="stage-card__period"><CalendarDays size={15} /> {period}</span>
        <h2>{title}</h2>
        <p>{count} tarefas nesta etapa</p>
        <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="stage-card__score"><strong>{progress}%</strong><span>concluído</span></div>
      <button aria-label={`Abrir ${title}`}><ChevronRight size={20} /></button>
    </article>
  )
}
