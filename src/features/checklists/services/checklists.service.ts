import { requireSupabase } from '@/features/shared/requireSupabase'

export async function listChecklist(taskId: string) {
  const { data, error } = await requireSupabase()
    .from('task_checklist_items').select('*').eq('task_id', taskId).order('sort_order')
  if (error) throw error
  return data
}

export async function setChecklistItemCompleted(itemId: string, completed: boolean) {
  const { data, error } = await requireSupabase()
    .from('task_checklist_items').update({ completed }).eq('id', itemId).select().single()
  if (error) throw error
  return data
}

export async function createChecklistItem(taskId: string, title: string, sortOrder: number) {
  const { data, error } = await requireSupabase().from('task_checklist_items').insert({ task_id: taskId, title, sort_order: sortOrder }).select().single()
  if (error) throw error; return data
}
export async function updateChecklistItem(itemId: string, input: { title?: string; sort_order?: number; required?: boolean }) {
  const { data, error } = await requireSupabase().from('task_checklist_items').update(input).eq('id', itemId).select().single()
  if (error) throw error; return data
}
export async function deleteChecklistItem(itemId: string) {
  const { error } = await requireSupabase().from('task_checklist_items').delete().eq('id', itemId)
  if (error) throw error
}
