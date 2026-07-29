import { Link } from 'react-router-dom'
type Item = { label: string; value: number }

export function ProgressCard({ title, subtitle, items, detailsTo }: { title: string; subtitle: string; items: Item[]; detailsTo: string }) {
  return (
    <article className="panel progress-card">
      <div className="panel__heading">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <Link className="text-button" to={detailsTo}>Ver detalhes</Link>
      </div>
      <div className="progress-list">
        {items.map((item) => (
          <div className="progress-item" key={item.label}>
            <div><span>{item.label}</span><strong>{item.value}%</strong></div>
            <div className="progress-track"><i style={{ width: `${item.value}%` }} /></div>
          </div>
        ))}
      </div>
    </article>
  )
}
