import type { Task, TaskInsert, TaskStatus } from '@/types/database'

export type { Task, TaskInsert, TaskStatus }

export type TaskFilters = {
  projectId: string
  stageId?: string
  areaId?: string
  status?: TaskStatus
  responsibleUserId?: string
  search?: string
  includeArchived?: boolean
}

export type TaskUpdate = Partial<Omit<TaskInsert, 'project_id'>> & {
  completion_percentage?: number
  approved_at?: string | null
  archived_at?: string | null
}
