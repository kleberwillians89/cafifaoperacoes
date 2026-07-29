export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'waiting_external'
  | 'blocked'
  | 'under_review'
  | 'completed'
  | 'cancelled'

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
