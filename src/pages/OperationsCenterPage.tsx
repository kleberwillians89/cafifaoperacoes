import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { RegionErrorBoundary } from '@/components/feedback/RegionErrorBoundary'
import { useProjectData } from '@/hooks/useProjectData'
import { useOperationalRelations } from '@/features/operations/hooks/useOperationalRelations'
import { useProject } from '@/features/projects/ProjectProvider'
import { formatOperationalDate, isValidDateValue, normalizeCentralData } from '@/features/operations/utils/operations-center'
import { ActivityRegion, AssistantRegion, LiveIndicators, OperationalMapRegion, TimelineRegion, TodayRegion } from '@/components/operations/OperationsCenterRegions'

export function OperationsCenterPage() {
  const projectQuery = useProjectData()
  const relationsQuery = useOperationalRelations()
  const { project, loading: projectLoading } = useProject()
  const [slow, setSlow] = useState(false)

  const waiting = projectLoading || projectQuery.isLoading || relationsQuery.isLoading
  useEffect(() => {
    if (!waiting) { setSlow(false); return }
    const timer = window.setTimeout(() => setSlow(true), 8_000)
    return () => window.clearTimeout(timer)
  }, [waiting])

  if (waiting) return <><LoadingState />{slow && <p className="slow-loading" role="status">O carregamento está levando mais tempo que o normal. A conexão continua ativa.</p>}</>
  if (!project) return <ErrorState title="Projeto não disponível" description="Sua sessão não possui um projeto ativo acessível." />
  if (projectQuery.error || relationsQuery.error || !projectQuery.data || !relationsQuery.data) return <ErrorState title="Não foi possível abrir a Central Operacional" description="Uma consulta falhou. Tente novamente sem recarregar toda a aplicação." onRetry={() => { void projectQuery.refetch(); void relationsQuery.refetch() }} />

  const data = normalizeCentralData({ ...projectQuery.data, ...relationsQuery.data })
  const eventDate = isValidDateValue(project.event_date) ? project.event_date : data.milestones.find((item) => isValidDateValue(item.milestone_date))?.milestone_date ?? null
  const days = eventDate ? Math.ceil((new Date(`${eventDate}T12:00:00`).getTime() - Date.now()) / 86400000) : null

  return <div className="operations-center" data-refetching={projectQuery.isFetching || relationsQuery.isFetching ? 'true' : 'false'}>
    <header className="operations-center__hero"><div><span>Central Operacional</span><h1>Direção da operação em tempo real</h1><p>Prioridades, saúde, cronograma e inteligência reunidos em uma visão executiva.</p></div><div className="operations-countdown"><CalendarClock/><span>Dia D</span><strong>{days === null ? 'Data não informada' : days >= 0 ? `Faltam ${days} dias` : `Há ${Math.abs(days)} dias`}</strong><small>{formatOperationalDate(eventDate)}</small></div></header>
    <RegionErrorBoundary region="indicators" title="Não foi possível carregar os indicadores."><LiveIndicators data={data}/></RegionErrorBoundary>
    <section className="center-grid">
      <RegionErrorBoundary region="map" title="Não foi possível carregar o mapa operacional."><OperationalMapRegion data={data}/></RegionErrorBoundary>
      <div className="center-side">
        <RegionErrorBoundary region="indicators" title="Não foi possível carregar os dados de hoje."><TodayRegion data={data}/></RegionErrorBoundary>
        <RegionErrorBoundary region="activity" title="Não foi possível carregar a atividade."><ActivityRegion data={data}/></RegionErrorBoundary>
      </div>
    </section>
    <RegionErrorBoundary region="timeline" title="Não foi possível carregar a timeline."><TimelineRegion data={data}/></RegionErrorBoundary>
    <RegionErrorBoundary region="assistant" title="Não foi possível carregar o Assistente."><AssistantRegion/></RegionErrorBoundary>
  </div>
}
