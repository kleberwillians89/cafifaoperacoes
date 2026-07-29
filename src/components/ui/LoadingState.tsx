export function LoadingState({ label = 'Carregando informações…' }: { label?: string }) {
  return <div className="state-card" role="status"><span className="spinner" /><p>{label}</p></div>
}
