import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, EvidenceItem, Milestone, Profile, Project, ProjectRisk, Task } from '../../src/types/database.js'
import { getOperationalDate } from './date.js'
import { buildAreaOperationalView, buildExecutiveOperationalView, buildTodayOperationalView, calculateTaskPriorityScore, findEvidenceGaps, findOperationalBottlenecks, findUpcomingMilestoneRisks, type IntelligenceInput } from './operational-intelligence.js'
import type { OperationalContext, RoutedRequest } from './schemas.js'

type BuilderInput = { client: SupabaseClient<Database>; project: Project; userId: string; route: RoutedRequest }
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const compactTask = (task: Task, stageName: string | null) => ({ id: task.id, title: task.title, area_id: task.area_id, stage_id: task.stage_id, stage_name: stageName, task_type: task.task_type, status: task.status, priority: task.priority, due_date: task.due_date, completion_percentage: task.completion_percentage, blocked_reason: task.blocked_reason, evidence_required: task.evidence_required, primary_responsible_user_id: task.primary_responsible_user_id, operational_responsible: task.original_responsible_label })

export async function buildOperationalContext({ client, project, userId, route }: BuilderInput): Promise<{ context: OperationalContext; focus: { type: 'area' | 'task' | 'milestone' | 'risk' | null; id: string | null; label: string | null }; counts: Record<string, number> }> {
  const date = getOperationalDate()
  const [areasResult, stagesResult, tasksResult, milestonesResult, risksResult, evidenceResult, membersResult, linksResult] = await Promise.all([
    client.from('areas').select('*').eq('project_id', project.id).eq('active', true).order('sort_order'),
    client.from('project_stages').select('*').eq('project_id', project.id).order('sort_order'),
    client.from('tasks').select('*').eq('project_id', project.id).is('archived_at', null),
    client.from('project_milestones').select('*').eq('project_id', project.id).order('milestone_date'),
    client.from('project_risks').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    client.from('project_evidence_items').select('*').eq('project_id', project.id).order('due_date'),
    client.from('project_members').select('*').eq('project_id', project.id).eq('active', true),
    client.from('task_milestones').select('*'),
  ])
  const firstError = [areasResult, stagesResult, tasksResult, milestonesResult, risksResult, evidenceResult, membersResult, linksResult].find((result) => result.error)?.error
  if (firstError) throw firstError
  const areas = areasResult.data ?? []
  const tasks = tasksResult.data ?? []
  const milestones = (milestonesResult.data ?? []) as Milestone[]
  const risks = (risksResult.data ?? []) as ProjectRisk[]
  const evidences = (evidenceResult.data ?? []) as EvidenceItem[]
  const taskMilestoneLinks = linksResult.data ?? []
  const members = membersResult.data ?? []
  const intelligence: IntelligenceInput = { today: date.iso_date, nextSevenDays: date.next_seven_days_end, tasks, areas, milestones, risks, evidences }

  const hint = route.intent === 'FOLLOW_UP' ? route.previous?.entity_label : route.entityHint
  const areaMatches = hint ? areas.filter((area) => normalize(hint).includes(normalize(area.name)) || normalize(area.name).includes(normalize(hint))) : []
  const taskMatches = hint ? tasks.filter((task) => normalize(task.title).includes(normalize(hint)) || normalize(hint).includes(normalize(task.title).slice(0, 35))) : []
  const milestoneMatches = hint ? milestones.filter((item) => normalize(item.title).includes(normalize(hint))) : []
  const riskMatches = hint ? risks.filter((item) => normalize(item.title).includes(normalize(hint))) : []
  const previousId = route.intent === 'FOLLOW_UP' ? route.previous?.entity_id : null
  const focusArea = areas.find((area) => area.id === previousId) ?? areaMatches[0] ?? null
  const focusTask = tasks.find((task) => task.id === previousId) ?? taskMatches[0] ?? null
  const focusMilestone = milestones.find((item) => item.id === previousId) ?? milestoneMatches[0] ?? null
  const focusRisk = risks.find((item) => item.id === previousId) ?? riskMatches[0] ?? null

  let selectedTasks = tasks
  let selectedAreas = areas
  let selectedMilestones = milestones
  let selectedRisks = risks
  let selectedEvidence = evidences
  let focus: { type: 'area' | 'task' | 'milestone' | 'risk' | null; id: string | null; label: string | null } = { type: null, id: null, label: null }

  const entityFocusedIntent = ['AREA', 'RESPONSIBLE', 'SUMMARY', 'NEXT_ACTIONS', 'PRIORITY', 'EVIDENCE', 'SEARCH', 'FOLLOW_UP']
  if (entityFocusedIntent.includes(route.intent) && focusArea) {
    selectedAreas = [focusArea]; selectedTasks = tasks.filter((task) => task.area_id === focusArea.id)
    const ids = new Set(selectedTasks.map((task) => task.id))
    const milestoneIds = new Set(taskMilestoneLinks.filter((link) => ids.has(link.task_id)).map((link) => link.milestone_id))
    selectedMilestones = milestones.filter((item) => milestoneIds.has(item.id))
    selectedEvidence = evidences.filter((item) => item.task_id && ids.has(item.task_id))
    selectedRisks = []
    focus = { type: 'area', id: focusArea.id, label: focusArea.name }
  } else if ((['TASK', 'RESPONSIBLE', 'SUMMARY', 'NEXT_ACTIONS', 'PRIORITY', 'EVIDENCE', 'SEARCH', 'FOLLOW_UP'].includes(route.intent)) && focusTask) {
    selectedTasks = [focusTask]; selectedAreas = areas.filter((area) => area.id === focusTask.area_id)
    selectedMilestones = milestones.filter((item) => taskMilestoneLinks.some((link) => link.task_id === focusTask.id && link.milestone_id === item.id))
    selectedEvidence = evidences.filter((item) => item.task_id === focusTask.id)
    selectedRisks = []
    focus = { type: 'task', id: focusTask.id, label: focusTask.title }
  } else if (route.intent === 'MILESTONE' && focusMilestone) {
    const taskIds = new Set(taskMilestoneLinks.filter((link) => link.milestone_id === focusMilestone.id).map((link) => link.task_id))
    selectedMilestones = [focusMilestone]; selectedTasks = tasks.filter((task) => taskIds.has(task.id)); selectedAreas = areas.filter((area) => selectedTasks.some((task) => task.area_id === area.id)); selectedEvidence = evidences.filter((item) => item.milestone_id === focusMilestone.id || (item.task_id && taskIds.has(item.task_id))); selectedRisks = []
    focus = { type: 'milestone', id: focusMilestone.id, label: focusMilestone.title }
  } else if (route.intent === 'RISK' && focusRisk) {
    selectedRisks = [focusRisk]; selectedTasks = []; selectedAreas = []; selectedMilestones = []; selectedEvidence = []
    focus = { type: 'risk', id: focusRisk.id, label: focusRisk.title }
  } else {
    const healthRank = { red: 0, yellow: 1, green: 2 }
    selectedTasks = tasks.map((task) => ({ task, ...calculateTaskPriorityScore(task, intelligence) })).sort((a, b) => b.score - a.score).slice(0, route.intent === 'EXECUTIVE' ? 15 : 10).map((item) => item.task)
    selectedAreas = areas.map((area) => buildAreaOperationalView(area, intelligence)).sort((a, b) => healthRank[a.health.health] - healthRank[b.health.health]).slice(0, 10).map((view) => areas.find((area) => area.id === view.id)!)
    selectedMilestones = milestones.filter((item) => item.status !== 'completed').slice(0, 6)
    selectedRisks = risks.filter((item) => !['closed', 'mitigated'].includes(item.status)).slice(0, 6)
    selectedEvidence = findEvidenceGaps(intelligence).slice(0, 8).flatMap((task) => evidences.filter((item) => item.task_id === task.id))
    if (route.intent === 'OVERDUE') selectedTasks = tasks.filter((task) => task.due_date && task.due_date < date.iso_date && !['completed', 'cancelled'].includes(task.status)).slice(0, 20)
    if (route.intent === 'BLOCKED') selectedTasks = tasks.filter((task) => task.status === 'blocked').slice(0, 20)
    if (route.intent === 'EVIDENCE') {
      const gapIds = new Set(findEvidenceGaps(intelligence).map((task) => task.id))
      selectedTasks = tasks.filter((task) => gapIds.has(task.id)).slice(0, 20)
      selectedEvidence = evidences.filter((item) => item.task_id && gapIds.has(item.task_id)).slice(0, 20)
    }
  }

  const relevantTaskIds = selectedTasks.map((task) => task.id)
  const includeDetail = Boolean(focusTask || focusArea)
  const [checklistResult, profilesResult, commentsResult, historyResult, notificationsResult] = await Promise.all([
    relevantTaskIds.length ? client.from('task_checklist_items').select('*').in('task_id', relevantTaskIds).order('sort_order').limit(80) : Promise.resolve({ data: [], error: null }),
    members.length ? client.from('profiles').select('*').in('id', members.map((member) => member.user_id)) : Promise.resolve({ data: [], error: null }),
    includeDetail && relevantTaskIds.length ? client.from('task_comments').select('*').in('task_id', relevantTaskIds).is('deleted_at', null).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [], error: null }),
    includeDetail && relevantTaskIds.length ? client.from('task_history').select('*').in('task_id', relevantTaskIds).order('created_at', { ascending: false }).limit(30) : Promise.resolve({ data: [], error: null }),
    ['TODAY', 'EXECUTIVE'].includes(route.intent) ? client.from('notifications').select('*').eq('user_id', userId).is('read_at', null).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [], error: null }),
  ])
  const detailError = checklistResult.error || profilesResult.error || commentsResult.error || historyResult.error || notificationsResult.error
  if (detailError) throw detailError
  const profiles = profilesResult.data as Profile[]
  const areaViews = selectedAreas.map((area) => buildAreaOperationalView(area, intelligence))
  const summary = focusArea ? buildAreaOperationalView(focusArea, intelligence)
    : route.intent === 'TODAY' ? buildTodayOperationalView(intelligence) : buildExecutiveOperationalView(intelligence)

  return {
    focus,
    counts: {
      areas: areas.length,
      tasks: tasks.length,
      overdue: tasks.filter((task) => task.due_date && task.due_date < date.iso_date && !['completed', 'cancelled'].includes(task.status)).length,
      due_today: tasks.filter((task) => task.due_date === date.iso_date && !['completed', 'cancelled'].includes(task.status)).length,
      critical: tasks.filter((task) => task.priority === 'critical' && !['completed', 'cancelled'].includes(task.status)).length,
      blocked: tasks.filter((task) => task.status === 'blocked').length,
      unassigned: tasks.filter((task) => !task.primary_responsible_user_id && !['completed', 'cancelled'].includes(task.status)).length,
      milestones: milestones.length,
      evidences: evidences.length,
      history: historyResult.data.length,
    },
    context: {
      request_type: route.intent,
      current_date: date,
      project: { id: project.id, name: project.name.replace(/CAFIFA/gi, 'Santo Circuito'), event_date: project.event_date, status: project.status },
      summary,
      areas: areaViews,
      tasks: selectedTasks.slice(0, 20).map((task) => compactTask(task, stagesResult.data?.find((stage) => stage.id === task.stage_id)?.name ?? null)),
      milestones: selectedMilestones.map((item) => ({ id: item.id, title: item.title, date: item.milestone_date, status: item.status, priority: item.priority })),
      risks: selectedRisks.map((item) => ({ id: item.id, title: item.title, status: item.status, probability: item.probability, impact: item.impact, mitigation: item.mitigation_plan, contingency: item.contingency_plan })),
      evidences: selectedEvidence.map((item) => ({ id: item.id, title: item.title, task_id: item.task_id, milestone_id: item.milestone_id, due_date: item.due_date, completed: Boolean(item.completed_at || item.storage_path || item.external_url) })),
      checklists: checklistResult.data.map((item) => ({ id: item.id, task_id: item.task_id, title: item.title, required: item.required, completed: item.completed })),
      comments: commentsResult.data.map((item) => ({ id: item.id, task_id: item.task_id, type: item.comment_type, content: item.content, resolved: item.resolved, created_at: item.created_at })),
      history: historyResult.data.map((item) => ({ id: item.id, task_id: item.task_id, action: item.action, field_name: item.field_name, old_value: item.old_value, new_value: item.new_value, created_at: item.created_at })),
      notifications: notificationsResult.data.map((item) => ({ id: item.id, task_id: item.task_id, title: item.title, message: item.message, type: item.notification_type, created_at: item.created_at })),
      responsibles: members.map((member) => ({ user_id: member.user_id, access_level: member.access_level, name: profiles.find((profile) => profile.id === member.user_id)?.full_name ?? 'Sem nome' })),
      dependencies: { relationship_status: 'not_available', details: ['O schema não possui dependências explícitas entre tarefas. Relações indiretas só podem ser inferidas por área, etapa ou marco registrado.'] },
      alerts: findOperationalBottlenecks(intelligence),
      operational_findings: [
        ...findUpcomingMilestoneRisks(intelligence).map((item) => ({ type: 'fact', message: `Marco próximo: ${item.title}`, entity_id: item.id })),
        { type: 'calculation', message: `Contexto reduzido para ${selectedTasks.length} de ${tasks.length} tarefas visíveis pela RLS.` },
        { type: 'fact', message: 'Consulta executada com a sessão autenticada e limitada pela RLS.' },
      ],
    },
  }
}
