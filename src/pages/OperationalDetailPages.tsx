import { useState } from 'react'
import { ChevronDown, ChevronRight, Flag, ShieldAlert, UsersRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { OperationalTaskRow } from '@/components/operations/OperationalTaskRow'
import { useProjectData } from '@/hooks/useProjectData'
import { useOperationalRelations } from '@/features/operations/hooks/useOperationalRelations'
import { areaHealth, isActiveTask } from '@/features/operations/utils/operations'
import type { Task } from '@/types/database'

const progress = (tasks: Task[]) => Math.round(tasks.reduce((sum, task) => sum + task.completion_percentage, 0) / Math.max(tasks.length, 1))

export function AreaDetailPage() {
  const { areaId } = useParams()
  const project = useProjectData()
  const relations = useOperationalRelations()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [responsible, setResponsible] = useState('')
  const [sort, setSort] = useState<'priority' | 'due' | 'status'>('priority')
  if (project.isLoading || relations.isLoading) return <LoadingState/>
  if (project.error || relations.error) return <ErrorState onRetry={() => { void project.refetch(); void relations.refetch() }}/>
  const area = project.data?.areas.find((item) => item.id === areaId)
  if (!area || !project.data || !relations.data) return <ErrorState title="Área não encontrada" description="A área não existe ou não está disponível para seu acesso."/>
  const tasks = project.data.tasks.filter((task) => task.area_id === area.id)
  const health = areaHealth(tasks, relations.data.evidence)
  const filtered = tasks.filter((task) => !responsible || task.primary_responsible_user_id === responsible).sort((a, b) =>
    sort === 'due' ? (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
      : sort === 'status' ? a.status.localeCompare(b.status)
        : ['critical', 'high', 'medium', 'low'].indexOf(a.priority) - ['critical', 'high', 'medium', 'low'].indexOf(b.priority))
  const stageGroups = [...project.data.stages, null].map((stage) => ({
    id: stage?.id ?? 'none',
    stage,
    tasks: filtered.filter((task) => stage ? task.stage_id === stage.id : !task.stage_id),
  })).filter((group) => group.tasks.length)
  const taskIds = new Set(tasks.map((task) => task.id))
  const milestoneIds = new Set(relations.data.milestoneLinks.filter((link) => taskIds.has(link.task_id)).map((link) => link.milestone_id))
  const milestones = project.data.milestones.filter((item) => milestoneIds.has(item.id))
  const evidence = relations.data.evidence.filter((item) => item.task_id && taskIds.has(item.task_id))
  const profiles = relations.data.profiles
  const nextDue = tasks.filter((task) => isActiveTask(task) && task.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0]
  const recent = relations.data.history.filter((entry) => taskIds.has(entry.task_id)).slice(0, 10)
  const metrics = [
    ['Total', tasks.length], ['Concluídas', tasks.filter((task) => task.status === 'completed').length],
    ['Em andamento', tasks.filter((task) => task.status === 'in_progress').length],
    ['Pendentes', tasks.filter((task) => task.status === 'not_started').length],
    ['Atrasadas', health.overdue], ['Críticas', health.critical], ['Bloqueadas', health.blocked],
    ['Sem responsável', health.unassigned], ['Evidências pendentes', health.evidencePending],
  ]
  const toggle = (id: string) => setCollapsed((current) => {
    const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next
  })
  return <>
    <PageHeader eyebrow="Área operacional" title={area.name} description={area.description ?? 'Sem descrição registrada.'}
      actions={<Link className="secondary-button" to="/app/areas">Todas as áreas</Link>}/>
    <section className="operational-hero panel">
      <div><span>Saúde</span><strong className={`health-${health.level}`}>{health.level === 'red' ? 'Vermelha' : health.level === 'yellow' ? 'Amarela' : 'Verde'}</strong><small>{health.reasons.join(' · ')}</small></div>
      <div><span>Progresso</span><strong>{progress(tasks)}%</strong><div className="progress-track"><i style={{ width: `${progress(tasks)}%` }}/></div></div>
      <div><span>Próximo prazo</span><strong>{nextDue?.due_date ? new Date(`${nextDue.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Não definido'}</strong><small>{nextDue?.title ?? 'Nenhuma tarefa ativa com prazo'}</small></div>
      <div><span>Responsável principal</span><strong>{profiles.find((profile) => profile.id === area.responsible_user_id)?.full_name ?? area.original_responsible_label ?? 'Não definido'}</strong><small>{tasks.length} tarefas</small></div>
    </section>
    <section className="operational-metrics">{metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
    <section className="panel operational-section">
      <header><div><span className="panel-kicker">Execução</span><h2>Tarefas por etapa</h2></div><div className="operational-filters">
        <select value={responsible} onChange={(event) => setResponsible(event.target.value)}><option value="">Todos os responsáveis</option>{profiles.filter((profile) => tasks.some((task) => task.primary_responsible_user_id === profile.id)).map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name}</option>)}</select>
        <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="priority">Prioridade</option><option value="due">Prazo</option><option value="status">Status</option></select>
      </div></header>
      {!stageGroups.length ? <EmptyState title="Nenhuma tarefa encontrada nesta área." description="A área não possui tarefas para os filtros selecionados."/> : stageGroups.map((group) => {
        const isCollapsed = collapsed.has(group.id)
        return <div className="stage-group" key={group.id}>
          <button aria-expanded={!isCollapsed} aria-controls={`stage-${group.id}`} onClick={() => toggle(group.id)}>
            {isCollapsed ? <ChevronRight size={18}/> : <ChevronDown size={18}/>}<span><strong>{group.stage?.name ?? 'Sem etapa definida'}</strong><small>{group.tasks.length} tarefas · {progress(group.tasks)}% de progresso</small></span>
          </button>
          {!isCollapsed && <div id={`stage-${group.id}`} className="stage-group__tasks">{group.tasks.map((task) => <OperationalTaskRow task={task} area={area} stage={group.stage ?? undefined} responsible={profiles.find((profile) => profile.id === task.primary_responsible_user_id)} key={task.id}/>)}</div>}
        </div>
      })}
    </section>
    <div className="operational-columns">
      <RelationSection title="Responsáveis" icon={<UsersRound size={18}/>} empty="Esta área ainda não possui usuários responsáveis.">{profiles.filter((profile) => tasks.some((task) => task.primary_responsible_user_id === profile.id)).map((profile) => <button className="relation-row" onClick={() => setResponsible(profile.id)} key={profile.id}>{profile.full_name}<span>{tasks.filter((task) => task.primary_responsible_user_id === profile.id).length} tarefas</span></button>)}</RelationSection>
      <RelationSection title="Marcos" icon={<Flag size={18}/>} empty="Nenhum marco relacionado a esta área.">{milestones.map((item) => <Link className="relation-row" to={`/app/marcos/${item.id}`} key={item.id}>{item.title}<span>{item.milestone_date ?? 'Sem data'}</span></Link>)}</RelationSection>
      <RelationSection title="Riscos" icon={<ShieldAlert size={18}/>} empty="Nenhum risco relacionado a esta área."><p className="relation-note">O schema não possui relação explícita entre riscos e áreas.</p></RelationSection>
      <RelationSection title="Evidências" empty="Nenhuma evidência relacionada às tarefas desta área.">{evidence.map((item) => <div className="relation-row" key={item.id}>{item.title}<span>{item.completed_at || item.storage_path || item.external_url ? 'Disponível' : 'Pendente'}</span></div>)}</RelationSection>
      <RelationSection title="Atividade recente" empty="Nenhuma atividade recente nesta área.">{recent.map((entry) => <Link className="relation-row" to={`/app/tarefas/${entry.task_id}`} key={entry.id}>{entry.action}<span>{new Date(entry.created_at).toLocaleString('pt-BR')}</span></Link>)}</RelationSection>
    </div>
  </>
}

export function MilestoneDetailPage() {
  const { milestoneId } = useParams()
  const project = useProjectData(); const relations = useOperationalRelations()
  if (project.isLoading || relations.isLoading) return <LoadingState/>
  if (project.error || relations.error || !project.data || !relations.data) return <ErrorState/>
  const milestone = project.data.milestones.find((item) => item.id === milestoneId)
  if (!milestone) return <ErrorState title="Marco não encontrado"/>
  const taskIds = new Set(relations.data.milestoneLinks.filter((link) => link.milestone_id === milestone.id).map((link) => link.task_id))
  const tasks = project.data.tasks.filter((task) => taskIds.has(task.id))
  const areas = project.data.areas.filter((area) => tasks.some((task) => task.area_id === area.id))
  const evidence = relations.data.evidence.filter((item) => item.milestone_id === milestone.id || (item.task_id && taskIds.has(item.task_id)))
  return <><PageHeader eyebrow="Detalhe do marco" title={milestone.title} description={milestone.description ?? 'Sem descrição registrada.'} actions={<Link className="secondary-button" to="/app/marcos">Todos os marcos</Link>}/>
    <section className="operational-hero panel"><div><span>Status</span><StatusBadge status={milestone.status}/></div><div><span>Prioridade</span><PriorityBadge priority={milestone.priority}/></div><div><span>Data</span><strong>{milestone.milestone_date ? new Date(`${milestone.milestone_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Não definida'}</strong></div><div><span>Progresso relacionado</span><strong>{progress(tasks)}%</strong><small>{tasks.length} tarefas vinculadas</small></div></section>
    <RelationSection title="Tarefas relacionadas" empty="Não existem tarefas vinculadas diretamente a este marco.">{tasks.map((task) => <OperationalTaskRow task={task} area={areas.find((area) => area.id === task.area_id)} stage={project.data!.stages.find((stage) => stage.id === task.stage_id)} responsible={relations.data!.profiles.find((profile) => profile.id === task.primary_responsible_user_id)} key={task.id}/>)}</RelationSection>
    <div className="operational-columns"><RelationSection title="Áreas envolvidas" empty="Nenhuma área relacionada.">{areas.map((area) => <Link className="relation-row" to={`/app/areas/${area.id}`} key={area.id}>{area.name}</Link>)}</RelationSection><RelationSection title="Evidências" empty="Nenhuma evidência vinculada.">{evidence.map((item) => <div className="relation-row" key={item.id}>{item.title}</div>)}</RelationSection><RelationSection title="Riscos" empty="Não existem riscos vinculados diretamente a este marco."><p className="relation-note">O schema não possui relação explícita entre riscos e marcos.</p></RelationSection></div>
  </>
}

export function RiskDetailPage() {
  const { riskId } = useParams(); const project = useProjectData(); const relations = useOperationalRelations()
  if (project.isLoading || relations.isLoading) return <LoadingState/>
  if (project.error || relations.error || !project.data || !relations.data) return <ErrorState/>
  const risk = project.data.risks.find((item) => item.id === riskId)
  if (!risk) return <ErrorState title="Risco não encontrado"/>
  const owner = relations.data.profiles.find((profile) => profile.id === risk.responsible_user_id)
  return <><PageHeader eyebrow="Detalhe do risco" title={risk.title} description={risk.description ?? 'Sem descrição registrada.'} actions={<Link className="secondary-button" to="/app/riscos">Todos os riscos</Link>}/>
    <section className="operational-hero panel"><div><span>Status</span><strong>{risk.status}</strong></div><div><span>Probabilidade</span><strong>{risk.probability ?? 'Não definida'}</strong></div><div><span>Impacto</span><strong>{risk.impact ?? 'Não definido'}</strong></div><div><span>Responsável</span><strong>{owner?.full_name ?? risk.original_responsible_label ?? 'Não definido'}</strong><small>Atualizado em {new Date(risk.updated_at).toLocaleString('pt-BR')}</small></div></section>
    <div className="operational-columns"><RelationSection title="Mitigação" empty="Nenhum plano de mitigação registrado.">{risk.mitigation_plan && <p>{risk.mitigation_plan}</p>}</RelationSection><RelationSection title="Contingência" empty="Nenhum plano de contingência registrado.">{risk.contingency_plan && <p>{risk.contingency_plan}</p>}</RelationSection><RelationSection title="Itens impactados" empty="Nenhuma relação direta registrada."><p className="relation-note">O schema não relaciona este risco diretamente a áreas, tarefas ou marcos. Nenhum impacto indireto é apresentado como fato.</p></RelationSection></div>
  </>
}

function RelationSection({ title, icon, empty, children }: { title: string; icon?: React.ReactNode; empty: string; children: React.ReactNode }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return <section className="panel relation-section"><header>{icon}<h2>{title}</h2></header>{hasContent ? children : <p className="empty-inline">{empty}</p>}</section>
}
