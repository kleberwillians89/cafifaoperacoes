import { requireSupabase } from '@/features/shared/requireSupabase'

type NewComment = { taskId: string; userId: string; content: string }
export async function listComments(taskId: string) {
  const { data, error } = await requireSupabase().from('task_comments').select('*').eq('task_id', taskId).is('deleted_at', null).order('created_at')
  if (error) throw error; return data
}

export async function createComment(input: NewComment) {
  const { data, error } = await requireSupabase().from('task_comments').insert({
    task_id: input.taskId, user_id: input.userId, content: input.content, comment_type: 'comment',
  }).select().single()
  if (error) throw error
  return data
}

export async function createQuestion(input: NewComment) {
  const { data, error } = await requireSupabase().from('task_comments').insert({
    task_id: input.taskId, user_id: input.userId, content: input.content, comment_type: 'question',
  }).select().single()
  if (error) throw error
  return data
}

export async function answerQuestion(input: NewComment & { questionId: string }) {
  const { data, error } = await requireSupabase().from('task_comments').insert({
    task_id: input.taskId, user_id: input.userId, content: input.content,
    comment_type: 'answer', parent_comment_id: input.questionId,
  }).select().single()
  if (error) throw error
  return data
}

export async function resolveQuestion(questionId: string, userId: string) {
  const { data, error } = await requireSupabase().from('task_comments').update({
    resolved: true, resolved_by: userId, resolved_at: new Date().toISOString(),
  }).eq('id', questionId).eq('comment_type', 'question').select().single()
  if (error) throw error
  return data
}
