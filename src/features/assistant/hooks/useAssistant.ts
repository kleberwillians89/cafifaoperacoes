import { useCallback, useEffect, useRef, useState } from 'react'
import { askAssistant } from '../services/assistant.service'
import type { AssistantAnswer, ChatMessage } from '../types'
import { selectRelevantHistory, updateContextMemory } from '../utils/context-memory'

export const INITIAL_QUESTIONS = [
  'O que preciso fazer hoje?',
  'Como está a Produção?',
  'O que está atrasado?',
  'O que ameaça o Dia D?',
  'Monte um resumo executivo.',
]

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [lastQuestion, setLastQuestion] = useState('')
  const previous = useRef<AssistantAnswer['context'] | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const snapshotLoaded = useRef(false)

  useEffect(() => {
    if (snapshotLoaded.current) return
    snapshotLoaded.current = true
    const controller = new AbortController()
    activeRequest.current = controller
    setLoading(true)
    void askAssistant('Carregue o resumo de hoje na operação.', [], null, controller.signal, true)
      .then((answer) => {
        previous.current = updateContextMemory(previous.current, answer)
        setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: answer.message, answer }])
      })
      .catch((error) => {
        const content = error instanceof Error ? error.message : 'Não foi possível carregar o resumo operacional.'
        setMessages([{ id: crypto.randomUUID(), role: 'assistant', content, failed: true }])
      })
      .finally(() => {
        setLoading(false)
        activeRequest.current = null
      })
    return () => controller.abort()
  }, [])

  const send = useCallback(async (question: string) => {
    const clean = question.trim()
    if (!clean || clean.length > 4_000 || loading || clean === lastQuestion) return
    const history = selectRelevantHistory(messages)
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: clean }
    setMessages((current) => [...current, userMessage])
    setLoading(true); setLastQuestion(clean)
    const controller = new AbortController(); activeRequest.current = controller
    try {
      const answer = await askAssistant(clean, history, previous.current, controller.signal)
      previous.current = updateContextMemory(previous.current, answer)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: answer.message, answer }])
    } catch (error) {
      const content = error instanceof Error ? error.message : 'Não foi possível consultar o Assistente CAFIFA.'
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content, failed: true }])
    } finally {
      setLoading(false); activeRequest.current = null
      window.setTimeout(() => setLastQuestion(''), 2_000)
    }
  }, [lastQuestion, loading, messages])

  const retry = useCallback(() => {
    const last = [...messages].reverse().find((item) => item.role === 'user')
    if (last) { setLastQuestion(''); void send(last.content) }
  }, [messages, send])
  return { messages, loading, send, retry, cancel: () => activeRequest.current?.abort() }
}
