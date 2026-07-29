import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  detail: string
  tone?: 'blue' | 'gold' | 'success' | 'danger' | 'neutral'
  icon: LucideIcon
}

export function MetricCard({ label, value, detail, tone = 'neutral', icon: Icon }: Props) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card__top">
        <span>{label}</span>
        <i><Icon size={18} aria-hidden="true" /></i>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}
