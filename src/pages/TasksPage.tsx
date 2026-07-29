import { useMemo, useState } from 'react'
import { CalendarDays, KanbanSquare, List, Plus, Table2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useProjectData } from '@/hooks/useProjectData'
import { useProject } from '@/features/projects/ProjectProvider'
import { listMembers } from '@/features/core/core.service'
import type { TaskPriority, TaskStatus } from '@/types/database'
import { useAuth } from '@/features/auth/AuthProvider'
import { EmptyState } from '@/components/ui/EmptyState'
import { groupTasks, taskOperationalScore, isOverdueTask } from '@/features/operations/utils/operations'

type View = 'list' | 'kanban' | 'table' | 'calendar'
export function TasksPage({ mine = false }: { mine?: boolean }) {
  const { project } = useProject(); const { data, isLoading } = useProjectData()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const members = useQuery({ queryKey: ['members', project?.id], enabled: Boolean(project), queryFn: () => listMembers(project!.id) })
  const [view, setView] = useState<View>('list'); const [search, setSearch] = useState(''); const [area, setArea] = useState(params.get('area') ?? ''); const [stage, setStage] = useState(params.get('stage') ?? ''); const [status, setStatus] = useState(params.get('status') ?? ''); const [priority, setPriority] = useState(''); const [responsible, setResponsible] = useState(''); const [due, setDue] = useState(params.get('filter') ?? ''); const [order, setOrder] = useState('operational'); const [group, setGroup] = useState('')
  const tasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const term = search.toLowerCase()
    return (data?.tasks ?? []).filter((t) => {
      const areaName = data?.areas.find((item) => item.id === t.area_id)?.name ?? t.original_area_label ?? ''
      const responsibleName = members.data?.find((member) => member.user_id === t.primary_responsible_user_id)?.profile.full_name ?? t.original_responsible_label ?? ''
      return (!mine || t.primary_responsible_user_id === user?.id)
        && (!search || `${t.title} ${t.description ?? ''} ${areaName} ${responsibleName}`.toLowerCase().includes(term))
        && (!area || t.area_id === area) && (!stage || t.stage_id === stage) && (!status || t.status === status)
        && (!priority || t.priority === priority) && (!responsible || t.primary_responsible_user_id === responsible)
        && (!due || (due === 'overdue' ? isOverdueTask(t, today) : due === 'today' ? t.due_date === today
          : due === 'blocked' ? t.status === 'blocked' : due === 'unassigned' ? !t.primary_responsible_user_id : t.due_date === due))
    }).sort((a, b) => order === 'title' ? a.title.localeCompare(b.title)
      : order === 'priority' ? ['critical','high','medium','low'].indexOf(a.priority) - ['critical','high','medium','low'].indexOf(b.priority)
        : order === 'operational' ? taskOperationalScore(b, today) - taskOperationalScore(a, today)
          : (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
  }, [data, members.data, mine, user?.id, search, area, stage, status, priority, responsible, due, order])
  if (isLoading) return <div className="skeleton-page" />
  const taskRow = (task: (typeof tasks)[number]) => <Link className="task-row" to={`/app/tarefas/${task.id}`} key={task.id}><div><strong>{task.title}</strong><small>{data?.areas.find((a) => a.id === task.area_id)?.name ?? task.original_area_label ?? 'Sem área'}</small></div><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /><span>{task.due_date ? new Date(`${task.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'}</span><UserAvatar name={members.data?.find((m) => m.user_id === task.primary_responsible_user_id)?.profile.full_name ?? task.original_responsible_label ?? 'Não atribuído'} /></Link>
  return <><PageHeader eyebrow="Execução" title={mine ? 'Minhas tarefas' : 'Todas as tarefas'} description={`${tasks.length} tarefas encontradas no escopo atual.`} actions={<Link className="primary-button" to="/app/tarefas/nova"><Plus size={16}/> Nova tarefa</Link>} />
    <div className="task-toolbar"><SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tarefa…" /><div className="view-switch">{([['list', List], ['kanban', KanbanSquare], ['table', Table2], ['calendar', CalendarDays]] as const).map(([key, Icon]) => <button className={view === key ? 'active' : ''} aria-label={`Visualização ${key}`} aria-pressed={view === key} onClick={() => setView(key)} key={key}><Icon size={16}/></button>)}</div></div>
    <div className="filters-row">
      <select value={area} onChange={(e) => setArea(e.target.value)}><option value="">Todas as áreas</option>{data?.areas.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}</select>
      <select value={stage} onChange={(e) => setStage(e.target.value)}><option value="">Todas as etapas</option>{data?.stages.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select>
      <select value={responsible} onChange={(e) => setResponsible(e.target.value)}><option value="">Responsável</option>{members.data?.map((m) => <option value={m.user_id} key={m.id}>{m.profile.full_name}</option>)}</select>
      <select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">Prioridade</option>{(['critical','high','medium','low'] as TaskPriority[]).map((v) => <option value={v} key={v}>{v}</option>)}</select>
      <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Status</option>{(['not_started','in_progress','waiting_external','blocked','under_review','completed','cancelled'] as TaskStatus[]).map((v) => <option value={v} key={v}>{v}</option>)}</select>
      <select value={due} onChange={(e) => setDue(e.target.value)}><option value="">Situação</option><option value="today">Vencem hoje</option><option value="overdue">Atrasadas</option><option value="blocked">Bloqueadas</option><option value="unassigned">Sem responsável</option></select>
      <select value={group} onChange={(e) => setGroup(e.target.value)}><option value="">Sem agrupamento</option><option value="area">Agrupar por área</option><option value="stage">Agrupar por etapa</option><option value="status">Agrupar por status</option><option value="responsible">Agrupar por responsável</option></select>
      <select value={order} onChange={(e) => setOrder(e.target.value)}><option value="operational">Prioridade operacional</option><option value="due">Ordenar por prazo</option><option value="title">Título</option><option value="priority">Prioridade</option></select>
    </div>
    {!tasks.length ? <div className="panel empty-panel"><EmptyState title="Nenhuma tarefa encontrada" description="Ajuste os filtros para visualizar outras tarefas."/></div> : view === 'kanban' ? <div className="kanban-board">{(['not_started','in_progress','waiting_external','blocked','under_review','completed'] as TaskStatus[]).map((column) => <section className="kanban-column" key={column}><h2><StatusBadge status={column}/><span>{tasks.filter((t) => t.status === column).length}</span></h2>{tasks.filter((t) => t.status === column).map(taskRow)}</section>)}</div> : view === 'calendar' ? <div className="calendar-grid">{tasks.filter((t) => t.due_date).map((t) => <Link to={`/app/tarefas/${t.id}`} key={t.id}><time>{new Date(`${t.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</time><strong>{t.title}</strong></Link>)}</div> : group && data ? <div className="task-groups">{groupTasks(tasks, group, data, members.data).map((item) => <section className="task-group panel" key={item.label}><header><h2>{item.label}</h2><span>{item.tasks.length}</span></header><div className={`tasks-list view-${view}`}>{item.tasks.map(taskRow)}</div></section>)}</div> : <div className={`tasks-list view-${view}`}>{tasks.map(taskRow)}</div>}
  </>
}
