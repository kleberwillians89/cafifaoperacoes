import type { AssistantAnswer, ChatMessage } from '../types'

export type ContextMemory = AssistantAnswer['context'] | null

const FOLLOW_UP_PATTERN = /^(e\b|e quem|e qual|e como|quem|qual|nessa|nessa tarefa|nessa área)/i

export function selectRelevantHistory(messages: ChatMessage[], limit = 4) {
  const valid = messages.filter((message) => !message.failed && message.content.trim())
  if (!valid.length) return []
  const lastUser = [...valid].reverse().find((message) => message.role === 'user')
  const contextual = lastUser && FOLLOW_UP_PATTERN.test(lastUser.content)
  const windowSize = contextual ? limit : Math.min(2, limit)
  return valid.slice(-windowSize)
}

export function updateContextMemory(current: ContextMemory, answer: AssistantAnswer): ContextMemory {
  const focus = answer.context?.focus
  if (!answer.context || (!focus?.id && answer.context.intent === 'UNKNOWN')) return current
  return answer.context
}
