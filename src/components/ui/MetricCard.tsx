import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

type Props = {
  label: string
  value: string
  detail: string
  tone?: 'blue' | 'gold' | 'success' | 'danger' | 'neutral'
  icon: LucideIcon
  to?: string
}

export function MetricCard({ label, value, detail, tone = 'neutral', icon: Icon, to }: Props) {
  const content = (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card__top">
        <span>{label}</span>
        <i><Icon size={18} aria-hidden="true" /></i>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
  return to ? <Link className="metric-card-link" to={to}>{content}</Link> : content
}
