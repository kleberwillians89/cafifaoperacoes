import type { TaskFilters } from '../types'

export const taskQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskQueryKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskQueryKeys.lists(), filters] as const,
  detail: (taskId: string) => [...taskQueryKeys.all, 'detail', taskId] as const,
  history: (taskId: string) => [...taskQueryKeys.detail(taskId), 'history'] as const,
}
