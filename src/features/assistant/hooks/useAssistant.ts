import { useCallback, useEffect, useRef, useState } from 'react'
import { AssistantClientError, askAssistant } from '../services/assistant.service'
import type { AssistantAnswer, ChatMessage } from '../types'
import { selectRelevantHistory, updateContextMemory } from '../utils/context-memory'
import { useProject } from '@/features/projects/ProjectProvider'
import { useLocation, useNavigate } from 'react-router-dom'

export const INITIAL_QUESTIONS = [
  'O que preciso fazer hoje?',
  'Como está a Produção?',
  'O que está atrasado?',
  'O que ameaça o Dia D?',
  'Monte um resumo executivo.',
]

export function useAssistant() {
  const { project, loading: projectLoading } = useProject()
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [lastQuestion, setLastQuestion] = useState('')
  const [slow, setSlow] = useState(false)
  const requestSequence = useRef(0)
  const previous = useRef<AssistantAnswer['context'] | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const snapshotLoaded = useRef(false)

  useEffect(() => {
    if (snapshotLoaded.current || projectLoading || !project) return
    snapshotLoaded.current = true
    const controller = new AbortController()
    let settled = false
    activeRequest.current = controller
    setLoading(true)
    void askAssistant(project.id, 'Carregue o resumo de hoje na operação.', [], null, controller.signal, true)
      .then((answer) => {
        previous.current = updateContextMemory(previous.current, answer)
        setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: answer.message, answer }])
      })
      .catch((error) => {
        if (error instanceof AssistantClientError && ['ASSISTANT_SESSION_MISSING', 'ASSISTANT_SESSION_INVALID'].includes(error.code)) navigate('/login', { replace: true, state: { from: location.pathname } })
        const content = error instanceof Error ? error.message : 'Não foi possível carregar o resumo operacional.'
        setMessages([{ id: crypto.randomUUID(), role: 'assistant', content, failed: true }])
      })
      .finally(() => {
        settled = true
        setLoading(false)
        activeRequest.current = null
      })
    return () => { controller.abort(); if (!settled) snapshotLoaded.current = false }
  }, [location.pathname, navigate, project, projectLoading])

  useEffect(() => {
    if (!loading) { setSlow(false); return }
    const timer = window.setTimeout(() => setSlow(true), 8_000)
    return () => window.clearTimeout(timer)
  }, [loading])

  const send = useCallback(async (question: string) => {
    const clean = question.trim()
    if (!project || !clean || clean.length > 4_000 || loading || clean === lastQuestion) return false
    const history = selectRelevantHistory(messages)
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: clean }
    setMessages((current) => [...current, userMessage])
    setLoading(true); setLastQuestion(clean)
    const controller = new AbortController(); activeRequest.current = controller
    const sequence = ++requestSequence.current
    try {
      const answer = await askAssistant(project.id, clean, history, previous.current, controller.signal)
      if (sequence !== requestSequence.current) return false
      previous.current = updateContextMemory(previous.current, answer)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: answer.message, answer }])
    } catch (error) {
      if (controller.signal.aborted || sequence !== requestSequence.current) return false
      if (error instanceof AssistantClientError && ['ASSISTANT_SESSION_MISSING', 'ASSISTANT_SESSION_INVALID'].includes(error.code)) navigate('/login', { replace: true, state: { from: location.pathname } })
      const content = error instanceof Error ? error.message : 'Não foi possível consultar o Assistente Santo Circuito.'
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content, failed: true }])
    } finally {
      setLoading(false); activeRequest.current = null
      window.setTimeout(() => setLastQuestion(''), 2_000)
    }
    return true
  }, [lastQuestion, loading, location.pathname, messages, navigate, project])

  const retry = useCallback(() => {
    const last = [...messages].reverse().find((item) => item.role === 'user')
    if (last) { setLastQuestion(''); void send(last.content) }
  }, [messages, send])
  return { messages, loading, slow, projectReady: Boolean(project) && !projectLoading, send, retry, cancel: () => { requestSequence.current += 1; activeRequest.current?.abort() } }
}
