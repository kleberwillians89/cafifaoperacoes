import { useState, type FormEvent, type ReactNode } from 'react'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useProject } from '@/features/projects/ProjectProvider'
import { useProjectData } from '@/hooks/useProjectData'
import { archiveArea, createInvitation, deleteEvidence, deleteMilestone, deleteRisk, listEvidence, listMembers, listProjectHistory, saveArea, saveEvidence, saveMilestone, saveRisk, updateMemberRole } from '@/features/core/core.service'
import type { Area, EvidenceItem, Milestone, ProjectRisk } from '@/types/database'
import { useAuth } from '@/features/auth/AuthProvider'

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="modal-layer" onMouseDown={onClose}><div className="modal-card" onMouseDown={(e) => e.stopPropagation()}><header><h2>{title}</h2><button aria-label="Fechar" onClick={onClose}>×</button></header>{children}</div></div> }
function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) { return <div className="row-actions"><button aria-label="Editar" onClick={onEdit}><Edit3 size={15}/></button><button aria-label="Excluir" onClick={onDelete}><Trash2 size={15}/></button></div> }
const invalidate = (client: ReturnType<typeof useQueryClient>) => client.invalidateQueries({ queryKey: ['project-data'] })

export function AreasPage() {
  const { project } = useProject(); const { data } = useProjectData(); const client = useQueryClient(); const [editing, setEditing] = useState<Area | null | undefined>()
  const save = useMutation({ mutationFn: (input: Partial<Area> & { name: string }) => saveArea(project!.id, input, editing?.id), onSuccess: () => { invalidate(client); setEditing(undefined) } })
  return <><PageHeader eyebrow="Estrutura" title="Áreas" description="Frentes operacionais e responsáveis." actions={<button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/> Nova área</button>}/><div className="entity-grid">{data?.areas.map((area) => <article className={`entity-card ${!area.active ? 'inactive' : ''}`} key={area.id}><div><span className="eyebrow">Área operacional</span><h2><Link to={`/app/areas/${area.id}`}>{area.name}</Link></h2><p>{area.description || 'Sem descrição.'}</p><small>{data.tasks.filter((t) => t.area_id === area.id).length} tarefas · {area.active ? 'Ativa' : 'Inativa'}</small><Link className="entity-detail-link" to={`/app/areas/${area.id}`}>Ver detalhes</Link></div><Actions onEdit={() => setEditing(area)} onDelete={async () => { await archiveArea(area.id); invalidate(client) }}/></article>)}</div>{editing !== undefined && <Modal title={editing ? 'Editar área' : 'Nova área'} onClose={() => setEditing(undefined)}><EntityForm initial={editing ?? {}} fields={['name','description']} onSubmit={(value) => save.mutate(value as unknown as Partial<Area> & { name: string })}/></Modal>}</>
}

export function RisksPage() {
  const { project } = useProject(); const { data } = useProjectData(); const client = useQueryClient(); const [editing, setEditing] = useState<ProjectRisk | null | undefined>()
  const save = useMutation({ mutationFn: (input: Partial<ProjectRisk> & { title: string }) => saveRisk(project!.id, input, editing?.id), onSuccess: () => { invalidate(client); setEditing(undefined) } })
  return <><PageHeader eyebrow="Governança" title="Riscos" description="Probabilidade, impacto, mitigação e contingência." actions={<button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/> Novo risco</button>}/><div className="entity-grid">{data?.risks.map((risk) => <article className="entity-card" key={risk.id}><div><span className="eyebrow">{risk.status}</span><h2><Link to={`/app/riscos/${risk.id}`}>{risk.title}</Link></h2><p>{risk.description || 'Sem descrição.'}</p><div className="risk-scores"><span>Probabilidade: {risk.probability ?? '—'}</span><span>Impacto: {risk.impact ?? '—'}</span></div><small>Mitigação: {risk.mitigation_plan || 'Não definida'}</small><Link className="entity-detail-link" to={`/app/riscos/${risk.id}`}>Ver detalhes</Link></div><Actions onEdit={() => setEditing(risk)} onDelete={async () => { await deleteRisk(risk.id); invalidate(client) }}/></article>)}</div>{editing !== undefined && <Modal title={editing ? 'Editar risco' : 'Novo risco'} onClose={() => setEditing(undefined)}><EntityForm initial={editing ?? { status: 'identified' }} fields={['title','description','probability','impact','status','mitigation_plan','contingency_plan']} onSubmit={(value) => save.mutate(value as Partial<ProjectRisk> & { title: string })}/></Modal>}</>
}

export function MilestonesPage() {
  const { project } = useProject(); const { data } = useProjectData(); const client = useQueryClient(); const [editing, setEditing] = useState<Milestone | null | undefined>()
  const save = useMutation({ mutationFn: (input: Partial<Milestone> & { title: string }) => saveMilestone(project!.id, input, editing?.id), onSuccess: () => { invalidate(client); setEditing(undefined) } })
  return <><PageHeader eyebrow="Cronograma" title="Marcos" description="Gates, checkpoints e datas inegociáveis." actions={<button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/> Novo marco</button>}/><div className="timeline">{data?.milestones.map((item) => <article key={item.id}><time>{item.milestone_date ? new Date(`${item.milestone_date}T12:00:00`).toLocaleDateString('pt-BR') : 'A definir'}</time><i/><div><StatusBadge status={item.status}/><h2><Link to={`/app/marcos/${item.id}`}>{item.title}</Link></h2><p>{item.description}</p><PriorityBadge priority={item.priority}/><Link className="entity-detail-link" to={`/app/marcos/${item.id}`}>Ver detalhes</Link></div><Actions onEdit={() => setEditing(item)} onDelete={async () => { await deleteMilestone(item.id); invalidate(client) }}/></article>)}</div>{editing !== undefined && <Modal title={editing ? 'Editar marco' : 'Novo marco'} onClose={() => setEditing(undefined)}><EntityForm initial={editing ?? { status: 'not_started', priority: 'critical' }} fields={['title','description','milestone_date','priority','status']} onSubmit={(value) => save.mutate(value as Partial<Milestone> & { title: string })}/></Modal>}</>
}

export function EvidencePage() {
  const { project } = useProject(); const client = useQueryClient(); const query = useQuery({ queryKey: ['evidence', project?.id], enabled: Boolean(project), queryFn: () => listEvidence(project!.id) }); const [editing, setEditing] = useState<EvidenceItem | null | undefined>()
  const save = useMutation({ mutationFn: (input: Partial<EvidenceItem> & { title: string }) => saveEvidence(project!.id, input, editing?.id), onSuccess: () => { client.invalidateQueries({ queryKey: ['evidence'] }); setEditing(undefined) } })
  return <><PageHeader eyebrow="Acervo" title="Evidências" description="Arquivos, links, prazos e responsáveis." actions={<button className="primary-button" onClick={() => setEditing(null)}><Plus size={16}/> Nova evidência</button>}/>{!query.data?.items.length ? <EmptyState title="Nenhuma evidência" description="Registre a primeira evidência do projeto."/> : <div className="entity-grid">{query.data.items.map((item) => <article className="entity-card" key={item.id}><div><span className="eyebrow">{query.data.categories.find((c) => c.id === item.category_id)?.name ?? 'Sem categoria'}</span><h2>{item.title}</h2><p>{item.description}</p>{item.external_url && <a href={item.external_url} target="_blank" rel="noreferrer">Abrir link</a>}<small>Prazo: {item.due_date ? new Date(`${item.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'não definido'}</small></div><Actions onEdit={() => setEditing(item)} onDelete={async () => { await deleteEvidence(item.id); client.invalidateQueries({ queryKey: ['evidence'] }) }}/></article>)}</div>}{editing !== undefined && <Modal title={editing ? 'Editar evidência' : 'Nova evidência'} onClose={() => setEditing(undefined)}><EntityForm initial={editing ?? {}} fields={['title','description','external_url','due_date']} onSubmit={(value) => save.mutate(value as Partial<EvidenceItem> & { title: string })}/></Modal>}</>
}

export function TeamPage() {
  const { project } = useProject(); const query = useQuery({ queryKey: ['members', project?.id], enabled: Boolean(project), queryFn: () => listMembers(project!.id) })
  return <><PageHeader eyebrow="Organização" title="Equipe" description="Integrantes, funções e níveis de acesso."/><div className="team-list">{query.data?.map((member) => <article key={member.id}><UserAvatar name={member.profile.full_name}/><div><strong>{member.profile.full_name}</strong><span>{member.profile.email}</span></div><span className="role-badge">{member.access_level}</span><small>{member.active ? 'Ativo' : 'Inativo'}</small></article>)}</div></>
}

export function ProjectPage() {
  const { project } = useProject(); const { data } = useProjectData()
  if (!project) return <EmptyState title="Projeto não encontrado" description="Seu usuário ainda não está vinculado a um projeto."/>
  const completion = Math.round((data?.tasks.reduce((s, t) => s + t.completion_percentage, 0) ?? 0) / Math.max(data?.tasks.length ?? 0, 1))
  return <><PageHeader eyebrow="Projeto ativo" title={project.name} description={project.description ?? project.organization_name}/><section className="project-hero panel"><div><span>Progresso geral</span><strong>{completion}%</strong><div className="progress-track"><i style={{ width: `${completion}%` }}/></div></div><div><span>Data do evento</span><strong>{project.event_date ? new Date(`${project.event_date}T12:00:00`).toLocaleDateString('pt-BR') : 'A definir'}</strong></div><div><span>Status</span><strong>{project.status}</strong></div></section><div className="timeline compact">{data?.stages.map((stage) => <article key={stage.id}><time>{stage.original_period_label ?? stage.start_date ?? '—'}</time><i/><div><h2>{stage.name}</h2><p>{stage.description}</p><small>{data.tasks.filter((t) => t.stage_id === stage.id).length} tarefas</small></div></article>)}</div></>
}

export function HistoryPage() {
  const { project } = useProject()
  const query = useQuery({ queryKey: ['project-history', project?.id], enabled: Boolean(project), queryFn: () => listProjectHistory(project!.id) })
  return <><PageHeader eyebrow="Auditoria" title="Histórico" description="Registro consolidado das alterações nas tarefas."/><div className="panel history-line">{query.data?.map((entry) => <div key={entry.id}><i/><span><strong>{entry.taskTitle}</strong>{entry.action} {entry.field_name ? `· ${entry.field_name}` : ''}<small>{new Date(entry.created_at).toLocaleString('pt-BR')}</small></span></div>)}</div></>
}

export function AdministrationPage() {
  const { project, membership } = useProject(); const { user } = useAuth(); const client = useQueryClient()
  const members = useQuery({ queryKey: ['members', project?.id], enabled: Boolean(project), queryFn: () => listMembers(project!.id) })
  const canManage = membership?.access_level === 'admin'
  async function invite(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!project || !user) return; const form = new FormData(event.currentTarget); await createInvitation(project.id, user.id, { email: String(form.get('email')), full_name: String(form.get('full_name')), role: String(form.get('role')) as 'admin' | 'manager' | 'member' | 'viewer' }); event.currentTarget.reset() }
  return <><PageHeader eyebrow="Administração" title="Acessos e permissões" description="Convites e funções respeitando as políticas do projeto."/>
    {!canManage && <div className="inline-notice">Somente administradores podem alterar acessos.</div>}
    {canManage && <section className="panel detail-section"><header><Plus size={18}/><h2>Convidar integrante</h2></header><form className="admin-invite" onSubmit={invite}><input name="full_name" placeholder="Nome"/><input name="email" type="email" placeholder="E-mail" required/><select name="role"><option value="member">Membro</option><option value="manager">Gestor</option><option value="viewer">Visualizador</option><option value="admin">Administrador</option></select><button className="primary-button">Criar convite</button></form></section>}
    <div className="team-list">{members.data?.map((member) => <article key={member.id}><UserAvatar name={member.profile.full_name}/><div><strong>{member.profile.full_name}</strong><span>{member.profile.email}</span></div><select disabled={!canManage} value={member.access_level} onChange={async (e) => { await updateMemberRole(member.id, e.target.value as typeof member.access_level); client.invalidateQueries({ queryKey: ['members'] }) }}><option value="admin">Admin</option><option value="manager">Gestor</option><option value="member">Membro</option><option value="viewer">Viewer</option></select><small>{member.active ? 'Ativo' : 'Inativo'}</small></article>)}</div>
  </>
}

function EntityForm({ initial, fields, onSubmit }: { initial: Record<string, unknown>; fields: string[]; onSubmit: (value: Record<string, string>) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>; onSubmit(data) }
  return <form className="entity-form" onSubmit={submit}>{fields.map((field) => <label className="field" key={field}><span>{field.replaceAll('_', ' ')}</span>{['description','mitigation_plan','contingency_plan'].includes(field) ? <textarea name={field} defaultValue={String(initial[field] ?? '')}/> : ['probability','impact'].includes(field) ? <select name={field} defaultValue={String(initial[field] ?? '')}><option value="">Não definido</option><option value="low">Baixo</option><option value="medium">Médio</option><option value="high">Alto</option>{field === 'impact' && <option value="critical">Crítico</option>}</select> : field === 'status' ? <select name={field} defaultValue={String(initial[field] ?? '')}><option value="identified">Identificado</option><option value="monitoring">Monitorando</option><option value="mitigated">Mitigado</option><option value="occurred">Ocorrido</option><option value="closed">Fechado</option><option value="not_started">Não iniciado</option><option value="in_progress">Em andamento</option><option value="completed">Concluído</option></select> : field === 'priority' ? <select name={field} defaultValue={String(initial[field] ?? '')}><option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select> : <input type={field.includes('date') ? 'date' : field.includes('url') ? 'url' : 'text'} name={field} defaultValue={String(initial[field] ?? '')} required={['name','title'].includes(field)}/>}</label>)}<button className="primary-button" type="submit">Salvar</button></form>
}
