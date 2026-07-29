export type AssistantReference = {
  entity_type: 'area' | 'task' | 'milestone' | 'risk' | 'evidence'
  entity_id: string
  label: string
}
export type AssistantAnswer = {
  type: 'answer' | 'clarification' | 'error'
  message: string
  headline: string | null
  severity: 'info' | 'attention' | 'urgent'
  facts: { label: string; value: string }[]
  findings: { type: 'fact' | 'calculation' | 'inference' | 'recommendation'; message: string }[]
  references: AssistantReference[]
  suggested_questions: string[]
  context: { intent: string; focus: { type: string | null; id: string | null; label: string | null } }
}
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  answer?: AssistantAnswer
  failed?: boolean
}
