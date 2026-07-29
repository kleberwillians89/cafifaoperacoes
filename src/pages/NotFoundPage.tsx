import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <main className="not-found"><span>404</span><h1>Página não encontrada</h1><p>O endereço informado não existe ou foi movido.</p><Link className="primary-button" to="/app/dashboard"><ArrowLeft size={17} /> Voltar ao dashboard</Link></main>
}
