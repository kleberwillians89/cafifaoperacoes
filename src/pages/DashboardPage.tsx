import { AlertOctagon, Bell, CalendarClock, CheckCircle2, CircleDashed, Clock3, Gauge, Timer } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { ProgressCard } from '@/components/ui/ProgressCard'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useProjectData } from '@/hooks/useProjectData'
import { useAuth } from '@/features/auth/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { requireSupabase } from '@/features/shared/requireSupabase'
import { Link } from 'react-router-dom'
import { useOperationalRelations } from '@/features/operations/hooks/useOperationalRelations'
import { areaHealth } from '@/features/operations/utils/operations'

const icons = [Timer, CheckCircle2, Gauge, CalendarClock, AlertOctagon, CircleDashed, Clock3, Bell]
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)) : '—'

export function DashboardPage() {
  const query = useProjectData()
  const relations = useOperationalRelations()
  const { user } = useAuth()
  const notifications = useQuery({ queryKey: ['notifications-count', user?.id], enabled: Boolean(user), queryFn: async () => {
    const { count, error } = await requireSupabase().from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).is('read_at', null)
    if (error) throw error; return count ?? 0
  } })
  if (query.isLoading || relations.isLoading) return <LoadingState />
  if (query.error || relations.error || !query.data || !relations.data) return <ErrorState title="Não foi possível carregar o dashboard" description="Verifique sua conexão e tente novamente." />
  const { tasks, areas, stages, milestones, risks } = query.data
  const today = new Date().toISOString().slice(0, 10)
  const completed = tasks.filter((t) => t.status === 'completed').length
  const metrics = [
    { label: 'Tarefas totais', value: tasks.length, hint: 'Escopo oficial do projeto', to: '/app/tarefas' },
    { label: 'Concluídas', value: completed, hint: `${Math.round(completed / Math.max(tasks.length, 1) * 100)}% do total`, tone: 'success' as const, to: '/app/tarefas?status=completed' },
    { label: 'Em andamento', value: tasks.filter((t) => t.status === 'in_progress').length, hint: 'Em execução agora', tone: 'gold' as const, to: '/app/tarefas?status=in_progress' },
    { label: 'Atrasadas', value: tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'cancelled').length, hint: 'Prazo vencido', tone: 'danger' as const, to: '/app/tarefas?filter=overdue' },
    { label: 'Bloqueadas', value: tasks.filter((t) => t.status === 'blocked').length, hint: 'Exigem intervenção', tone: 'danger' as const, to: '/app/tarefas?filter=blocked' },
    { label: 'Riscos ativos', value: risks.filter((r) => !['closed', 'mitigated'].includes(r.status)).length, hint: `${risks.length} riscos registrados`, tone: 'gold' as const, to: '/app/riscos' },
    { label: 'Marcos', value: milestones.length, hint: `${milestones.filter((m) => m.status === 'completed').length} concluídos`, to: '/app/marcos' },
    { label: 'Notificações', value: notifications.data ?? 0, hint: 'Não lidas', tone: 'neutral' as const },
  ]
  const progress = (subset: typeof tasks) => Math.round(subset.reduce((sum, task) => sum + task.completion_percentage, 0) / Math.max(subset.length, 1))
  const stageProgress = stages.map((stage) => ({ label: stage.name, value: progress(tasks.filter((t) => t.stage_id === stage.id)) }))
  const areaProgress = areas.filter((area) => area.active).map((area) => ({ label: area.name, value: progress(tasks.filter((t) => t.area_id === area.id)) }))
  const upcoming = tasks.filter((t) => t.due_date && t.due_date >= today && t.status !== 'completed').sort((a, b) => a.due_date!.localeCompare(b.due_date!)).slice(0, 5)
  const alerts = areas.map((area) => ({ area, health: areaHealth(tasks.filter((task) => task.area_id === area.id), relations.data.evidence) })).filter((item) => item.health.level !== 'green').slice(0, 5)
  const recent = relations.data.history.slice(0, 6)
  return <>
    <PageHeader eyebrow="Visão geral" title="Central de operações" description="Dados em tempo real do projeto Santo Circuito." />
    <section className="metric-grid">{metrics.map((metric, index) => <MetricCard label={metric.label} detail={metric.hint} tone={metric.tone} value={String(metric.value)} icon={icons[index]} to={'to' in metric ? metric.to : undefined} key={metric.label} />)}</section>
    <section className="dashboard-grid">
      <ProgressCard title="Progresso por etapa" subtitle="Avanço do cronograma" items={stageProgress} detailsTo="/app/etapas" />
      <ProgressCard title="Progresso por área" subtitle="Frentes operacionais" items={areaProgress} detailsTo="/app/areas" />
      <article className="panel list-panel"><div className="panel__heading"><div><h2>Próximos prazos</h2><p>Entregas que exigem atenção</p></div></div><div className="deadline-list">{upcoming.map((item) => <Link to={`/app/tarefas/${item.id}`} key={item.id}><time>{formatDate(item.due_date)}</time><span><strong>{item.title}</strong><small>{areas.find((a) => a.id === item.area_id)?.name ?? 'Sem área'}</small></span><PriorityBadge priority={item.priority} /></Link>)}</div></article>
      <article className="panel list-panel"><div className="panel__heading"><div><h2>Próximos marcos</h2><p>Checkpoints oficiais</p></div></div><div className="milestone-list">{milestones.slice(0, 5).map((item) => <Link to={`/app/marcos/${item.id}`} key={item.id}><time>{formatDate(item.milestone_date)}</time><span><strong>{item.title}</strong><small>{item.description || 'Marco do projeto'}</small></span></Link>)}</div></article>
      <article className="panel list-panel"><div className="panel__heading"><div><h2>Áreas em alerta</h2><p>Saúde calculada pelas tarefas reais</p></div></div><div className="relation-list">{alerts.map(({ area, health }) => <Link className="relation-row" to={`/app/areas/${area.id}`} key={area.id}><strong>{area.name}</strong><span>{health.reasons[0]}</span></Link>)}</div></article>
      <article className="panel list-panel"><div className="panel__heading"><div><h2>Atividade recente</h2><p>Alterações registradas no histórico</p></div></div><div className="relation-list">{recent.map((entry) => <Link className="relation-row" to={`/app/tarefas/${entry.task_id}`} key={entry.id}><strong>{tasks.find((task) => task.id === entry.task_id)?.title ?? 'Tarefa'}</strong><span>{entry.action} · {new Date(entry.created_at).toLocaleString('pt-BR')}</span></Link>)}</div></article>
    </section>
  </>
}
