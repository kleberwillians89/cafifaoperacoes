import { TriangleAlert } from 'lucide-react'

export function ErrorState({ title = 'Não foi possível carregar', description = 'Tente novamente em alguns instantes.', onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="state-card state-card--error" role="alert">
      <i><TriangleAlert size={24} /></i><h3>{title}</h3><p>{description}</p>
      {onRetry && <button className="secondary-button" onClick={onRetry}>Tentar novamente</button>}
    </div>
  )
}
