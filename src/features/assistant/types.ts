import { z } from 'zod'

export const AssistantRequestSchema = z.object({
  message: z.string().trim().min(1).max(4_000),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4_000) })).max(6),
  active_project_id: z.string().uuid(),
  operational_snapshot: z.boolean(),
  previous: z.object({
    intent: z.string().nullable(),
    entity_type: z.enum(['area', 'task', 'milestone', 'risk']).nullable(),
    entity_id: z.string().uuid().nullable(),
    entity_label: z.string().max(200).nullable(),
  }).nullable(),
})

export const AssistantAnswerSchema = z.object({
  type: z.enum(['answer', 'clarification', 'error']).default('answer'),
  message: z.string(),
  headline: z.string().nullable().optional().default(null),
  severity: z.enum(['info', 'attention', 'urgent']).optional().default('info'),
  facts: z.array(z.object({ label: z.string(), value: z.string() })).optional().default([]),
  findings: z.array(z.object({ type: z.enum(['fact', 'calculation', 'inference', 'recommendation']), message: z.string() })).optional().default([]),
  references: z.array(z.object({ entity_type: z.enum(['area', 'task', 'milestone', 'risk', 'evidence']), entity_id: z.string().uuid(), label: z.string() })).optional().default([]),
  suggested_questions: z.array(z.string()).optional().default([]),
  context: z.object({ intent: z.string(), focus: z.object({ type: z.string().nullable(), id: z.string().nullable(), label: z.string().nullable() }) }),
  source: z.enum(['openai', 'operational_snapshot', 'fallback']).optional(),
  meta: z.object({ response_source: z.enum(['openai', 'operational_snapshot', 'operational_fallback']), fallback_used: z.boolean() }).optional(),
})

export type AssistantReference = z.infer<typeof AssistantAnswerSchema>['references'][number]
export type AssistantAnswer = z.infer<typeof AssistantAnswerSchema>
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  answer?: AssistantAnswer
  failed?: boolean
}
