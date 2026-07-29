import { requireSupabase } from '@/features/shared/requireSupabase'
import type { TaskFilters, TaskInsert, TaskStatus, TaskUpdate } from '../types'

export async function listTasks(filters: TaskFilters) {
  const client = requireSupabase()
  let query = client.from('tasks').select('*').eq('project_id', filters.projectId)
  if (!filters.includeArchived) query = query.is('archived_at', null)
  if (filters.stageId) query = query.eq('stage_id', filters.stageId)
  if (filters.areaId) query = query.eq('area_id', filters.areaId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.responsibleUserId) query = query.eq('primary_responsible_user_id', filters.responsibleUserId)
  if (filters.search?.trim()) query = query.ilike('title', `%${filters.search.trim()}%`)
  const { data, error } = await query.order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function getTaskById(taskId: string) {
  const { data, error } = await requireSupabase().from('tasks').select('*').eq('id', taskId).single()
  if (error) throw error
  return data
}

export async function createTask(input: TaskInsert) {
  const { data, error } = await requireSupabase().from('tasks').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateTask(taskId: string, input: TaskUpdate) {
  const { data, error } = await requireSupabase().from('tasks').update(input).eq('id', taskId).select().single()
  if (error) throw error
  return data
}

export function changeTaskStatus(taskId: string, status: TaskStatus, blockedReason?: string) {
  return updateTask(taskId, { status, blocked_reason: status === 'blocked' ? blockedReason : null })
}

export function completeTask(taskId: string) {
  return changeTaskStatus(taskId, 'completed')
}

export async function listTaskHistory(taskId: string) {
  const { data, error } = await requireSupabase()
    .from('task_history').select('*').eq('task_id', taskId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}
