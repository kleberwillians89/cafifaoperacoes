import { requireSupabase } from '@/features/shared/requireSupabase'

export async function listAttachments(taskId: string) {
  const { data, error } = await requireSupabase()
    .from('task_attachments').select('*').eq('task_id', taskId).is('deleted_at', null).order('created_at')
  if (error) throw error
  return data
}

export function buildEvidencePath(projectId: string, taskId: string, fileId: string, fileName: string) {
  const safeName = fileName.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-')
  return `${projectId}/${taskId}/${fileId}-${safeName}`
}

export async function createSignedEvidenceUrl(storagePath: string, expiresInSeconds = 300) {
  const { data, error } = await requireSupabase().storage.from('task-evidence').createSignedUrl(storagePath, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}

export async function uploadAttachment(projectId: string, taskId: string, userId: string, file: File) {
  const client = requireSupabase(); const fileId = crypto.randomUUID(); const path = buildEvidencePath(projectId, taskId, fileId, file.name)
  const { error: uploadError } = await client.storage.from('task-evidence').upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw uploadError
  const { data, error } = await client.from('task_attachments').insert({ task_id: taskId, uploaded_by: userId, file_name: file.name, storage_path: path, mime_type: file.type || null, file_size: file.size }).select().single()
  if (error) { await client.storage.from('task-evidence').remove([path]); throw error }
  return data
}
export async function removeAttachment(id: string, storagePath: string) {
  const client = requireSupabase()
  const { error } = await client.storage.from('task-evidence').remove([storagePath]); if (error) throw error
  const { error: rowError } = await client.from('task_attachments').update({ deleted_at: new Date().toISOString() }).eq('id', id); if (rowError) throw rowError
}
