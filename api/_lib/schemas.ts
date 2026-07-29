import { z } from 'zod'

export const IntentSchema = z.enum(['TODAY', 'AREA', 'TASK', 'MILESTONE', 'RISK', 'EXECUTIVE', 'FOLLOW_UP', 'UNKNOWN'])
export type Intent = z.infer<typeof IntentSchema>

export const EntityReferenceSchema = z.object({
  entity_type: z.enum(['area', 'task', 'milestone', 'risk', 'evidence']),
  entity_id: z.string().uuid(),
  label: z.string(),
})

export const AssistantResponseSchema = z.object({
  type: z.enum(['answer', 'clarification', 'error']),
  message: z.string(),
  headline: z.string().nullable(),
  severity: z.enum(['info', 'attention', 'urgent']),
  facts: z.array(z.object({ label: z.string(), value: z.string() })),
  findings: z.array(z.object({
    type: z.enum(['fact', 'calculation', 'inference', 'recommendation']),
    message: z.string(),
  })),
  references: z.array(EntityReferenceSchema),
  suggested_questions: z.array(z.string()),
})
export type AssistantResponse = z.infer<typeof AssistantResponseSchema>

export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4_000),
})

export const AssistantRequestSchema = z.object({
  message: z.string().trim().min(1).max(4_000),
  history: z.array(ConversationMessageSchema).max(6).default([]),
  previous: z.object({
    intent: IntentSchema.nullable(),
    entity_type: z.enum(['area', 'task', 'milestone', 'risk']).nullable(),
    entity_id: z.string().uuid().nullable(),
    entity_label: z.string().max(200).nullable(),
  }).nullable().default(null),
})
export type AssistantRequest = z.infer<typeof AssistantRequestSchema>

export type RoutedRequest = {
  intent: Intent
  query: string
  entityHint: string | null
  previous: AssistantRequest['previous']
}

export type HealthResult = {
  health: 'green' | 'yellow' | 'red'
  reasons: string[]
  facts: string[]
  inferences: string[]
}

export type OperationalContext = {
  request_type: Intent
  current_date: Record<string, string | number>
  project: Record<string, unknown>
  summary: Record<string, unknown>
  areas: Record<string, unknown>[]
  tasks: Record<string, unknown>[]
  milestones: Record<string, unknown>[]
  risks: Record<string, unknown>[]
  evidences: Record<string, unknown>[]
  checklists: Record<string, unknown>[]
  comments: Record<string, unknown>[]
  history: Record<string, unknown>[]
  notifications: Record<string, unknown>[]
  responsibles: Record<string, unknown>[]
  dependencies: { relationship_status: 'available' | 'not_available'; details: string[] }
  alerts: Record<string, unknown>[]
  operational_findings: Record<string, unknown>[]
}
