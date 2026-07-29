import { useState } from 'react'
import { Activity, Bot, CalendarClock, ChevronDown, ChevronRight, Flag, Map, Presentation, ShieldAlert, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'
import { useProjectData } from '@/hooks/useProjectData'
import { useOperationalRelations } from '@/features/operations/hooks/useOperationalRelations'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { areaHealth } from '@/features/operations/utils/operations'
import type { Task } from '@/types/database'
import { useProject } from '@/features/projects/ProjectProvider'

const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)) : 'Sem data'

export function OperationsCenterPage() {
  const project = useProjectData()
  const { project: activeProject } = useProject()
  const relations = useOperationalRelations()
  const [expanded, setExpanded] = useState<string[]>([])
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'event'>('week')
  if (project.isLoading || relations.isLoading) return <LoadingState />
  if (!project.data || !relations.data || project.error || relations.error) return <ErrorState title="Não foi possível abrir a Central Operacional" description="Os dados reais do projeto não puderam ser carregados." />
  const { tasks, areas, stages, milestones, risks } = project.data
  const today = new Date().toISOString().slice(0, 10)
  const end = new Date(); end.setDate(end.getDate() + (period === 'today' ? 0 : period === 'week' ? 7 : period === 'month' ? 30 : 365))
  const endIso = end.toISOString().slice(0, 10)
  const active = (task: Task) => !['completed', 'cancelled'].includes(task.status)
  const overdue = tasks.filter((task) => active(task) && task.due_date && task.due_date < today)
  const blocked = tasks.filter((task) => task.status === 'blocked')
  const upcomingTasks = tasks.filter((task) => active(task) && task.due_date && task.due_date >= today && task.due_date <= endIso)
  const timeline = [...milestones.map((item) => ({ id: item.id, type: 'Marco', title: item.title, date: item.milestone_date, route: `/app/marcos/${item.id}` })), ...upcomingTasks.map((item) => ({ id: item.id, type: 'Tarefa', title: item.title, date: item.due_date, route: `/app/tarefas/${item.id}` }))].filter((item) => item.date).sort((a, b) => a.date!.localeCompare(b.date!)).slice(0, 18)
  const healthRank = { red: 0, yellow: 1, green: 2 }
  const criticalAreas = areas.map((area) => ({ area, health: areaHealth(tasks.filter((task) => task.area_id === area.id), relations.data.evidence) })).sort((a, b) => healthRank[a.health.level] - healthRank[b.health.level])
  const activity = relations.data.history.slice(0, 6)
  const progress = Math.round(tasks.reduce((sum, task) => sum + task.completion_percentage, 0) / Math.max(tasks.length, 1))
  const eventMilestone = activeProject?.event_date ?? milestones.find((item) => item.milestone_date)?.milestone_date ?? null
  const days = eventMilestone ? Math.ceil((new Date(`${eventMilestone}T12:00:00`).getTime() - Date.now()) / 86400000) : null
  const toggle = (id: string) => setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  return <div className="operations-center">
    <header className="operations-center__hero"><div><span>Central Operacional</span><h1>Direção da operação em tempo real</h1><p>Prioridades, saúde, cronograma e inteligência reunidos em uma visão executiva.</p></div><div className="operations-countdown"><CalendarClock/><span>Dia D</span><strong>{days === null ? 'Data não informada' : days >= 0 ? `Faltam ${days} dias` : `Há ${Math.abs(days)} dias`}</strong><small>{dateLabel(eventMilestone)}</small></div></header>
    <section className="live-strip">
      <div><Target/><span>Saúde geral</span><strong className={overdue.length || blocked.length ? 'health-red' : 'health-green'}>{overdue.length || blocked.length ? 'Atenção' : 'Estável'}</strong></div>
      <div><Activity/><span>Progresso</span><strong>{progress}%</strong></div>
      <div><ShieldAlert/><span>Alertas</span><strong>{overdue.length + blocked.length}</strong></div>
      <div><Flag/><span>Próximos marcos</span><strong>{milestones.filter((item) => item.status !== 'completed').length}</strong></div>
    </section>
    <section className="center-grid">
      <article className="panel operational-map"><header><div><Map/><span><strong>Mapa operacional</strong><small>Projeto, áreas, etapas e entregas</small></span></div><Link to="/app/areas">Ver áreas</Link></header>
        <div className="map-root"><strong>CAFIFA</strong><span>{tasks.length} tarefas oficiais</span></div>
        {criticalAreas.map(({ area, health }) => {
          const areaTasks = tasks.filter((task) => task.area_id === area.id)
          const isOpen = expanded.includes(area.id)
          return <div className="map-area" key={area.id}><button onClick={() => toggle(area.id)}>{isOpen ? <ChevronDown/> : <ChevronRight/>}<span><strong>{area.name}</strong><small>{areaTasks.length} tarefas · {health.reasons[0]}</small></span><i className={`map-health health-${health.level}`}>{health.level === 'red' ? 'Crítica' : health.level === 'yellow' ? 'Atenção' : 'Estável'}</i></button>{isOpen && <div className="map-branches">{stages.filter((stage) => areaTasks.some((task) => task.stage_id === stage.id)).map((stage) => <div key={stage.id}><strong>{stage.name}</strong>{areaTasks.filter((task) => task.stage_id === stage.id).slice(0, 8).map((task) => <Link to={`/app/tarefas/${task.id}`} key={task.id}><span>{task.title}</span><small>{relations.data.checklist.filter((item) => item.task_id === task.id && item.completed).length}/{relations.data.checklist.filter((item) => item.task_id === task.id).length} checklist · {relations.data.evidence.filter((item) => item.task_id === task.id).length} evidências</small></Link>)}</div>)}</div>}</div>
        })}
      </article>
      <div className="center-side">
        <article className="panel today-panel"><header><strong>Hoje</strong><Link to="/app/tarefas">Abrir tarefas</Link></header><dl><div><dt>Atrasadas</dt><dd>{overdue.length}</dd></div><div><dt>Bloqueadas</dt><dd>{blocked.length}</dd></div><div><dt>Vencem hoje</dt><dd>{tasks.filter((task) => active(task) && task.due_date === today).length}</dd></div><div><dt>Riscos ativos</dt><dd>{risks.filter((risk) => !['closed', 'mitigated'].includes(risk.status)).length}</dd></div></dl></article>
        <article className="panel activity-panel"><header><Activity/><strong>Atividade recente</strong></header>{activity.map((entry) => <Link to={`/app/tarefas/${entry.task_id}`} key={entry.id}><span>{tasks.find((task) => task.id === entry.task_id)?.title ?? 'Tarefa'}</span><small>{entry.action} · {new Date(entry.created_at).toLocaleString('pt-BR')}</small></Link>)}</article>
      </div>
    </section>
    <section className="panel horizontal-timeline"><header><div><CalendarClock/><span><strong>Timeline operacional</strong><small>Tarefas e marcos no período</small></span></div><nav>{(['today', 'week', 'month', 'event'] as const).map((value) => <button className={period === value ? 'active' : ''} onClick={() => setPeriod(value)} key={value}>{value === 'today' ? 'Hoje' : value === 'week' ? 'Semana' : value === 'month' ? 'Mês' : 'Dia D'}</button>)}</nav></header><div>{timeline.length ? timeline.map((item) => <Link to={item.route} key={`${item.type}-${item.id}`}><time>{dateLabel(item.date)}</time><i/><strong>{item.title}</strong><small>{item.type}</small></Link>) : <p>Nenhuma entrega registrada neste período.</p>}</div></section>
    <section className="center-assistant"><header><div><Bot/><span><strong>Diretor de Operações CAFIFA</strong><small>Contexto real, referências e memória curta</small></span></div><button onClick={() => document.body.classList.toggle('executive-mode')}><Presentation size={16}/> Modo Executivo</button></header><AssistantPanel fullPage/></section>
  </div>
}
