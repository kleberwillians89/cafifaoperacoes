import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/ui/ErrorState'
import { reportFrontendError } from '@/lib/observability/frontend-errors'

type State = { hasError: boolean }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportFrontendError({ error, componentStack: info.componentStack, region: 'global' })
    if (import.meta.env.DEV) console.error('Erro inesperado na aplicação', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <main className="fatal-error"><ErrorState title="A aplicação encontrou um erro" description="Recarregue a página para continuar." onRetry={() => window.location.reload()} /></main>
    }
    return this.props.children
  }
}
