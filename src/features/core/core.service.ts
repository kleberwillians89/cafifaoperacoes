import { requireSupabase } from '@/features/shared/requireSupabase'
import type { Area, EvidenceCategory, EvidenceItem, Milestone, Profile, ProjectMember, ProjectRisk, ProjectStage, Task } from '@/types/database'

export async function getProjectData(projectId: string) {
  const client = requireSupabase()
  const [tasks, areas, stages, milestones, risks] = await Promise.all([
    client.from('tasks').select('*').eq('project_id', projectId).is('archived_at', null),
    client.from('areas').select('*').eq('project_id', projectId).order('sort_order'),
    client.from('project_stages').select('*').eq('project_id', projectId).order('sort_order'),
    client.from('project_milestones').select('*').eq('project_id', projectId).order('milestone_date'),
    client.from('project_risks').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
  ])
  const error = tasks.error || areas.error || stages.error || milestones.error || risks.error
  if (error) throw error
  return {
    tasks: (tasks.data ?? []) as Task[],
    areas: (areas.data ?? []) as Area[],
    stages: (stages.data ?? []) as ProjectStage[],
    milestones: (milestones.data ?? []) as Milestone[],
    risks: (risks.data ?? []) as ProjectRisk[],
  }
}

export async function listMembers(projectId: string) {
  const client = requireSupabase()
  const { data: members, error } = await client.from('project_members').select('*').eq('project_id', projectId).eq('active', true)
  if (error) throw error
  const ids = members.map((member) => member.user_id)
  const { data: profiles, error: profileError } = ids.length ? await client.from('profiles').select('*').in('id', ids) : { data: [], error: null }
  if (profileError) throw profileError
  return members.map((member) => ({ ...member, profile: (profiles as Profile[]).find((profile) => profile.id === member.user_id)! })) as (ProjectMember & { profile: Profile })[]
}

export async function saveArea(projectId: string, input: Partial<Area> & { name: string }, id?: string) {
  const client = requireSupabase()
  const payload = { project_id: projectId, name: input.name, slug: input.slug || slugify(input.name), description: input.description || null, responsible_user_id: input.responsible_user_id || null, sort_order: input.sort_order ?? 0, active: input.active ?? true }
  const query = id ? client.from('areas').update(payload).eq('id', id) : client.from('areas').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function archiveArea(id: string) {
  const { error } = await requireSupabase().from('areas').update({ active: false }).eq('id', id)
  if (error) throw error
}

export async function saveRisk(projectId: string, input: Partial<ProjectRisk> & { title: string }, id?: string) {
  const payload = { project_id: projectId, title: input.title, description: input.description || null, probability: input.probability || null, impact: input.impact || null, status: input.status || 'identified' as const, mitigation_plan: input.mitigation_plan || null, contingency_plan: input.contingency_plan || null, responsible_user_id: input.responsible_user_id || null }
  const client = requireSupabase(); const query = id ? client.from('project_risks').update(payload).eq('id', id) : client.from('project_risks').insert(payload)
  const { data, error } = await query.select().single(); if (error) throw error; return data
}

export async function deleteRisk(id: string) { const { error } = await requireSupabase().from('project_risks').delete().eq('id', id); if (error) throw error }
export async function saveMilestone(projectId: string, input: Partial<Milestone> & { title: string }, id?: string) {
  const payload = { project_id: projectId, title: input.title, description: input.description || null, milestone_date: input.milestone_date || null, stage_id: input.stage_id || null, priority: input.priority || 'critical' as const, status: input.status || 'not_started' as const }
  const client = requireSupabase(); const query = id ? client.from('project_milestones').update(payload).eq('id', id) : client.from('project_milestones').insert(payload)
  const { data, error } = await query.select().single(); if (error) throw error; return data
}
export async function deleteMilestone(id: string) { const { error } = await requireSupabase().from('project_milestones').delete().eq('id', id); if (error) throw error }

export async function listEvidence(projectId: string) {
  const client = requireSupabase()
  const [items, categories] = await Promise.all([client.from('project_evidence_items').select('*').eq('project_id', projectId).order('due_date'), client.from('evidence_categories').select('*').eq('project_id', projectId).order('sort_order')])
  if (items.error || categories.error) throw items.error || categories.error
  return { items: items.data as EvidenceItem[], categories: categories.data as EvidenceCategory[] }
}

export async function saveEvidence(projectId: string, input: Partial<EvidenceItem> & { title: string }, id?: string) {
  const payload = { project_id: projectId, title: input.title, description: input.description || null, category_id: input.category_id || null, task_id: input.task_id || null, milestone_id: input.milestone_id || null, storage_path: input.storage_path || null, external_url: input.external_url || null, responsible_user_id: input.responsible_user_id || null, due_date: input.due_date || null, completed_at: input.completed_at || null }
  const client = requireSupabase(); const query = id ? client.from('project_evidence_items').update(payload).eq('id', id) : client.from('project_evidence_items').insert(payload)
  const { data, error } = await query.select().single(); if (error) throw error; return data
}
export async function deleteEvidence(id: string) { const { error } = await requireSupabase().from('project_evidence_items').delete().eq('id', id); if (error) throw error }
export function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export async function listProjectHistory(projectId: string) {
  const client = requireSupabase()
  const { data: tasks, error: taskError } = await client.from('tasks').select('id,title').eq('project_id', projectId)
  if (taskError) throw taskError
  const ids = tasks.map((task) => task.id)
  if (!ids.length) return []
  const { data, error } = await client.from('task_history').select('*').in('task_id', ids).order('created_at', { ascending: false }).limit(500)
  if (error) throw error
  return data.map((entry) => ({ ...entry, taskTitle: tasks.find((task) => task.id === entry.task_id)?.title ?? 'Tarefa' }))
}

export async function updateMemberRole(id: string, accessLevel: ProjectMember['access_level']) {
  const { error } = await requireSupabase().from('project_members').update({ access_level: accessLevel }).eq('id', id)
  if (error) throw error
}

export async function createInvitation(projectId: string, invitedBy: string, input: { email: string; full_name: string; role: ProjectMember['access_level'] }) {
  const { data, error } = await requireSupabase().from('invitations').insert({ project_id: projectId, email: input.email, full_name: input.full_name || null, role: input.role, invited_by: invitedBy }).select().single()
  if (error) throw error; return data
}
