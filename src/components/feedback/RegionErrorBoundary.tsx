import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { reportFrontendError, type FrontendErrorRegion } from '@/lib/observability/frontend-errors'

type Props = { children: ReactNode; region: FrontendErrorRegion; title: string }
type State = { error: Error | null; resetKey: number }

export class RegionErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: 0 }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportFrontendError({ error, componentStack: info.componentStack, region: this.props.region })
  }

  render() {
    if (this.state.error) return <section className="panel region-error" role="alert"><strong>{this.props.title}</strong><span>O restante da Central continua disponível.</span><button onClick={() => this.setState(({ resetKey }) => ({ error: null, resetKey: resetKey + 1 }))}><RotateCcw size={14}/> Tentar novamente</button></section>
    return <div key={this.state.resetKey} className="region-boundary">{this.props.children}</div>
  }
}
