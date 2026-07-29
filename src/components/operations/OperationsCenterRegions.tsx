import { useState } from 'react'
import { Activity, Bot, CalendarClock, ChevronDown, ChevronRight, Flag, Map, Presentation, ShieldAlert, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'
import { areaHealth, isActiveTask } from '@/features/operations/utils/operations'
import { buildOperationalTimeline, formatOperationalDate, isValidDateValue, type CentralData } from '@/features/operations/utils/operations-center'

export function LiveIndicators({ data }: { data: CentralData }) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue = data.tasks.filter((task) => isActiveTask(task) && isValidDateValue(task.due_date) && task.due_date < today)
  const blocked = data.tasks.filter((task) => task.status === 'blocked')
  const progress = Math.round(data.tasks.reduce((sum, task) => sum + (Number.isFinite(task.completion_percentage) ? task.completion_percentage : 0), 0) / Math.max(data.tasks.length, 1))
  return <section className="live-strip">
    <div><Target/><span>Saúde geral</span><strong className={overdue.length || blocked.length ? 'health-red' : 'health-green'}>{overdue.length || blocked.length ? 'Atenção' : 'Estável'}</strong></div>
    <div><Activity/><span>Progresso</span><strong>{progress}%</strong></div>
    <div><ShieldAlert/><span>Alertas</span><strong>{overdue.length + blocked.length}</strong></div>
    <div><Flag/><span>Próximos marcos</span><strong>{data.milestones.filter((item) => item.status !== 'completed').length}</strong></div>
  </section>
}

export function OperationalMapRegion({ data }: { data: CentralData }) {
  const [expanded, setExpanded] = useState<string[]>([])
  const healthRank = { red: 0, yellow: 1, green: 2 }
  const areas = data.areas.map((area) => ({ area, health: areaHealth(data.tasks.filter((task) => task.area_id === area.id), data.evidence) })).sort((a, b) => healthRank[a.health.level] - healthRank[b.health.level])
  const toggle = (id: string) => setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  return <article className="panel operational-map"><header><div><Map/><span><strong>Mapa operacional</strong><small>Projeto, áreas, etapas e entregas</small></span></div><Link to="/app/areas">Ver áreas</Link></header>
    <div className="map-root"><strong>CAFIFA</strong><span>{data.tasks.length} tarefas oficiais</span></div>
    {!areas.length && <p className="empty-inline">Nenhuma área operacional disponível.</p>}
    {areas.map(({ area, health }) => {
      const areaTasks = data.tasks.filter((task) => task.area_id === area.id)
      const isOpen = expanded.includes(area.id)
      const stages = data.stages.filter((stage) => areaTasks.some((task) => task.stage_id === stage.id))
      const tasksWithoutStage = areaTasks.filter((task) => !task.stage_id || !data.stages.some((stage) => stage.id === task.stage_id))
      return <div className="map-area" key={area.id}><button onClick={() => toggle(area.id)}>{isOpen ? <ChevronDown/> : <ChevronRight/>}<span><strong>{area.name || 'Área sem nome'}</strong><small>{areaTasks.length} tarefas · {health.reasons[0] ?? 'Sem alerta calculado'}</small></span><i className={`map-health health-${health.level}`}>{health.level === 'red' ? 'Crítica' : health.level === 'yellow' ? 'Atenção' : 'Estável'}</i></button>{isOpen && <div className="map-branches">{[...stages.map((stage) => ({ id: stage.id, name: stage.name || 'Etapa sem nome', tasks: areaTasks.filter((task) => task.stage_id === stage.id) })), ...(tasksWithoutStage.length ? [{ id: `no-stage-${area.id}`, name: 'Sem etapa definida', tasks: tasksWithoutStage }] : [])].map((stage) => <div key={stage.id}><strong>{stage.name}</strong>{stage.tasks.slice(0, 8).map((task) => <Link to={`/app/tarefas/${task.id}`} key={task.id}><span>{task.title || 'Tarefa sem título'}</span><small>{data.checklist.filter((item) => item.task_id === task.id && item.completed).length}/{data.checklist.filter((item) => item.task_id === task.id).length} checklist · {data.evidence.filter((item) => item.task_id === task.id).length} evidências</small></Link>)}</div>)}</div>}</div>
    })}
  </article>
}

export function TodayRegion({ data }: { data: CentralData }) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue = data.tasks.filter((task) => isActiveTask(task) && isValidDateValue(task.due_date) && task.due_date < today)
  const blocked = data.tasks.filter((task) => task.status === 'blocked')
  return <article className="panel today-panel"><header><strong>Hoje</strong><Link to="/app/tarefas">Abrir tarefas</Link></header><dl><div><dt>Atrasadas</dt><dd>{overdue.length}</dd></div><div><dt>Bloqueadas</dt><dd>{blocked.length}</dd></div><div><dt>Vencem hoje</dt><dd>{data.tasks.filter((task) => isActiveTask(task) && task.due_date === today).length}</dd></div><div><dt>Riscos ativos</dt><dd>{data.risks.filter((risk) => !['closed', 'mitigated'].includes(risk.status)).length}</dd></div></dl></article>
}

export function ActivityRegion({ data }: { data: CentralData }) {
  const activity = data.history.slice(0, 6)
  return <article className="panel activity-panel"><header><Activity/><strong>Atividade recente</strong></header>{activity.length ? activity.map((entry) => <Link to={`/app/tarefas/${entry.task_id}`} key={entry.id}><span>{data.tasks.find((task) => task.id === entry.task_id)?.title ?? 'Tarefa'}</span><small>{entry.action || 'Alteração registrada'} · {new Date(entry.created_at).toLocaleString('pt-BR')}</small></Link>) : <p className="empty-inline">Nenhuma atividade registrada.</p>}</article>
}

export function TimelineRegion({ data }: { data: CentralData }) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'event'>('week')
  const today = new Date().toISOString().slice(0, 10)
  const end = new Date()
  end.setDate(end.getDate() + (period === 'today' ? 0 : period === 'week' ? 7 : period === 'month' ? 30 : 365))
  const timeline = buildOperationalTimeline(data, today, end.toISOString().slice(0, 10))
  return <section className="panel horizontal-timeline"><header><div><CalendarClock/><span><strong>Timeline operacional</strong><small>Tarefas e marcos no período</small></span></div><nav>{(['today', 'week', 'month', 'event'] as const).map((value) => <button className={period === value ? 'active' : ''} onClick={() => setPeriod(value)} key={value}>{value === 'today' ? 'Hoje' : value === 'week' ? 'Semana' : value === 'month' ? 'Mês' : 'Dia D'}</button>)}</nav></header><div>{timeline.length ? timeline.map((item) => <Link to={item.route} key={`${item.type}-${item.id}`}><time>{formatOperationalDate(item.date)}</time><i/><strong>{item.title}</strong><small>{item.type}</small></Link>) : <p>Nenhuma entrega registrada neste período.</p>}</div></section>
}

export function AssistantRegion() {
  return <section className="center-assistant"><header><div><Bot/><span><strong>Diretor de Operações CAFIFA</strong><small>Contexto real, referências e memória curta</small></span></div><button onClick={() => document.body.classList.toggle('executive-mode')}><Presentation size={16}/> Modo Executivo</button></header><AssistantPanel fullPage/></section>
}
