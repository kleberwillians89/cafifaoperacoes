import { Inbox } from 'lucide-react'

export function EmptyState({ title = 'Nada por aqui', description = 'Os itens aparecerão aqui quando estiverem disponíveis.' }) {
  return (
    <div className="state-card">
      <i><Inbox size={24} /></i><h3>{title}</h3><p>{description}</p>
    </div>
  )
}
