import { requireSupabase } from '@/features/shared/requireSupabase'
import type {
  ChecklistItem, EvidenceCategory, EvidenceItem, Profile, ProjectMember,
  TaskAssignee, TaskComment, TaskHistory, TaskMilestone,
} from '@/types/database'

export async function getOperationalRelations(projectId: string) {
  const client = requireSupabase()
  const { data: projectTasks, error: taskError } = await client
    .from('tasks').select('id').eq('project_id', projectId).is('archived_at', null)
  if (taskError) throw taskError
  const taskIds = projectTasks.map((task) => task.id)
  const [
    membersResult, profilesResult, evidenceResult, categoriesResult, milestoneLinksResult,
    assigneesResult, checklistResult, commentsResult, historyResult,
  ] = await Promise.all([
    client.from('project_members').select('*').eq('project_id', projectId).eq('active', true),
    client.from('profiles').select('*'),
    client.from('project_evidence_items').select('*').eq('project_id', projectId).order('due_date'),
    client.from('evidence_categories').select('*').eq('project_id', projectId).order('sort_order'),
    taskIds.length ? client.from('task_milestones').select('*').in('task_id', taskIds) : Promise.resolve({ data: [], error: null }),
    taskIds.length ? client.from('task_assignees').select('*').in('task_id', taskIds) : Promise.resolve({ data: [], error: null }),
    taskIds.length ? client.from('task_checklist_items').select('*').in('task_id', taskIds).order('sort_order') : Promise.resolve({ data: [], error: null }),
    taskIds.length ? client.from('task_comments').select('*').in('task_id', taskIds).is('deleted_at', null).order('created_at', { ascending: false }).limit(500) : Promise.resolve({ data: [], error: null }),
    taskIds.length ? client.from('task_history').select('*').in('task_id', taskIds).order('created_at', { ascending: false }).limit(500) : Promise.resolve({ data: [], error: null }),
  ])
  const error = membersResult.error || profilesResult.error || evidenceResult.error || categoriesResult.error
    || milestoneLinksResult.error || assigneesResult.error || checklistResult.error || commentsResult.error || historyResult.error
  if (error) throw error
  return {
    members: membersResult.data as ProjectMember[],
    profiles: profilesResult.data as Profile[],
    evidence: evidenceResult.data as EvidenceItem[],
    categories: categoriesResult.data as EvidenceCategory[],
    milestoneLinks: milestoneLinksResult.data as TaskMilestone[],
    assignees: assigneesResult.data as TaskAssignee[],
    checklist: checklistResult.data as ChecklistItem[],
    comments: commentsResult.data as TaskComment[],
    history: historyResult.data as TaskHistory[],
  }
}
