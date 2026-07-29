export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer'
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived'
export type TaskStatus = 'not_started' | 'in_progress' | 'waiting_external' | 'blocked' | 'under_review' | 'completed' | 'cancelled'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
export type TaskAssignmentType = 'responsible' | 'supporting' | 'approver'
export type TaskType = 'task' | 'milestone' | 'checkpoint' | 'event_day' | 'post_event'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'
export type RiskStatus = 'identified' | 'monitoring' | 'mitigated' | 'occurred' | 'closed'
export type RiskProbability = 'low' | 'medium' | 'high'
export type RiskImpact = 'low' | 'medium' | 'high' | 'critical'

type GenericTable<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

type Audit = { created_at: string; updated_at: string }
type Id = { id: string }

export type Profile = Id & Audit & { full_name: string; email: string; avatar_url: string | null; global_role: UserRole; active: boolean }
export type Project = Id & Audit & { organization_name: string; name: string; slug: string; description: string | null; event_date: string | null; status: ProjectStatus; created_by: string | null; archived_at: string | null }
export type ProjectMember = Id & Audit & { project_id: string; user_id: string; access_level: UserRole; active: boolean; invited_by: string | null; joined_at: string | null }
export type Area = Id & Audit & { project_id: string; name: string; slug: string; description: string | null; responsible_user_id: string | null; original_responsible_label: string | null; sort_order: number; active: boolean }
export type ProjectStage = Id & Audit & { project_id: string; number: number | null; name: string; slug: string; stage_type: 'week' | 'event_day' | 'post_event' | 'complementary'; start_date: string | null; end_date: string | null; original_period_label: string | null; description: string | null; sort_order: number; source_key: string | null; metadata: Json }
export type Task = Id & Audit & {
  project_id: string; area_id: string | null; stage_id: string | null; title: string; description: string | null
  task_type: TaskType; status: TaskStatus; priority: TaskPriority; original_area_label: string | null
  original_responsible_label: string | null; original_status_label: string | null; original_priority_label: string | null
  original_due_date_label: string | null; primary_responsible_user_id: string | null; approver_user_id: string | null
  start_date: string | null; due_date: string | null; blocked_reason: string | null; evidence_required: boolean
  approval_required: boolean; completion_percentage: number; source_key: string | null; source_page: number | null
  source_section: string | null; metadata: Json; created_by: string | null; completed_at: string | null
  approved_at: string | null; archived_at: string | null
}
export type TaskInsert = {
  project_id: string; title: string; area_id?: string | null; stage_id?: string | null; description?: string | null
  task_type?: TaskType; status?: TaskStatus; priority?: TaskPriority; primary_responsible_user_id?: string | null
  approver_user_id?: string | null; start_date?: string | null; due_date?: string | null; blocked_reason?: string | null
  evidence_required?: boolean; approval_required?: boolean; source_key?: string | null; source_page?: number | null
  source_section?: string | null; metadata?: Json; created_by?: string | null
}
export type TaskAssignee = Id & { task_id: string; user_id: string; assignment_type: TaskAssignmentType; assigned_by: string | null; created_at: string }
export type ChecklistItem = Id & Audit & { task_id: string; title: string; description: string | null; required: boolean; completed: boolean; completed_by: string | null; completed_at: string | null; sort_order: number }
export type TaskComment = Id & Audit & { task_id: string; user_id: string; content: string; comment_type: 'comment' | 'question' | 'answer' | 'update' | 'blocker'; parent_comment_id: string | null; resolved: boolean; resolved_by: string | null; resolved_at: string | null; deleted_at: string | null }
export type TaskAttachment = Id & { task_id: string; uploaded_by: string; file_name: string; storage_path: string; mime_type: string | null; file_size: number | null; description: string | null; created_at: string; deleted_at: string | null }
export type TaskHistory = Id & { task_id: string; user_id: string | null; action: string; field_name: string | null; old_value: Json; new_value: Json; metadata: Json; created_at: string }

export type ProjectMemberArea = Id & { project_member_id: string; area_id: string; can_view: boolean; can_manage: boolean; created_at: string }
export type Milestone = Id & Audit & { project_id: string; stage_id: string | null; title: string; description: string | null; milestone_date: string | null; original_date_label: string | null; priority: TaskPriority; status: TaskStatus; source_key: string | null; metadata: Json }
export type TaskMilestone = Id & { task_id: string; milestone_id: string; created_at: string }
export type ProjectRisk = Id & Audit & { project_id: string; title: string; description: string | null; probability: RiskProbability | null; impact: RiskImpact | null; status: RiskStatus; mitigation_plan: string | null; contingency_plan: string | null; responsible_user_id: string | null; original_responsible_label: string | null; source_key: string | null; metadata: Json }
export type EvidenceCategory = Id & Audit & { project_id: string; name: string; description: string | null; sort_order: number; source_key: string | null }
export type EvidenceItem = Id & Audit & { project_id: string; category_id: string | null; task_id: string | null; milestone_id: string | null; title: string; description: string | null; storage_path: string | null; external_url: string | null; responsible_user_id: string | null; original_responsible_label: string | null; due_date: string | null; completed_at: string | null; source_key: string | null; metadata: Json }
export type Invitation = Id & Audit & { project_id: string | null; email: string; full_name: string | null; role: UserRole; status: InvitationStatus; token_hash: string | null; expires_at: string | null; accepted_at: string | null; invited_by: string }
export type Notification = Id & { user_id: string; project_id: string | null; task_id: string | null; title: string; message: string; notification_type: string; source_key: string | null; read_at: string | null; created_at: string }

export interface Database {
  public: {
    Tables: {
      profiles: GenericTable<Profile>
      projects: GenericTable<Project>
      project_members: GenericTable<ProjectMember>
      project_member_areas: GenericTable<ProjectMemberArea>
      areas: GenericTable<Area>
      project_stages: GenericTable<ProjectStage>
      tasks: GenericTable<Task, TaskInsert, Partial<Task>>
      task_assignees: GenericTable<TaskAssignee>
      task_checklist_items: GenericTable<ChecklistItem>
      task_comments: GenericTable<TaskComment>
      task_attachments: GenericTable<TaskAttachment>
      task_history: GenericTable<TaskHistory>
      project_milestones: GenericTable<Milestone>
      task_milestones: GenericTable<TaskMilestone>
      project_risks: GenericTable<ProjectRisk>
      evidence_categories: GenericTable<EvidenceCategory>
      project_evidence_items: GenericTable<EvidenceItem>
      invitations: GenericTable<Invitation>
      notifications: GenericTable<Notification>
    }
    Views: Record<string, never>
    Functions: {
      can_manage_area: { Args: { target_area_id: string }; Returns: boolean }
      can_manage_project: { Args: { target_project_id: string }; Returns: boolean }
      can_update_task: { Args: { target_task_id: string }; Returns: boolean }
      can_view_area: { Args: { target_area_id: string }; Returns: boolean }
      can_view_task: { Args: { target_task_id: string }; Returns: boolean }
      current_profile_id: { Args: Record<PropertyKey, never>; Returns: string }
      is_active_user: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_project_member: { Args: { target_project_id: string }; Returns: boolean }
    }
    Enums: {
      user_role: UserRole
      project_status: ProjectStatus
      task_status: TaskStatus
      task_priority: TaskPriority
      task_assignment_type: TaskAssignmentType
      task_type: TaskType
      invitation_status: InvitationStatus
      risk_status: RiskStatus
      risk_probability: RiskProbability
      risk_impact: RiskImpact
    }
    CompositeTypes: Record<string, never>
  }
}
