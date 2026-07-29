type Item = { label: string; value: number }

export function ProgressCard({ title, subtitle, items }: { title: string; subtitle: string; items: Item[] }) {
  return (
    <article className="panel progress-card">
      <div className="panel__heading">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <button className="text-button" type="button">Ver detalhes</button>
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
