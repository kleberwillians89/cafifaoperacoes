// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const send = vi.fn(async () => true)
const retry = vi.fn()
let assistantState = {
  messages: [] as { id: string; role: 'user' | 'assistant'; content: string }[],
  loading: false,
  slow: false,
  projectReady: false,
  send,
  retry,
  cancel: vi.fn(),
}

vi.mock('../hooks/useAssistant', () => ({
  INITIAL_QUESTIONS: ['O que preciso fazer hoje?'],
  useAssistant: () => assistantState,
}))

import { AssistantPanel } from './AssistantPanel'

describe('AssistantPanel no React 19', () => {
  let container: HTMLDivElement
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(function (this: HTMLElement) {
        return this
      }),
    })
    assistantState = { ...assistantState, messages: [], loading: false, slow: false, projectReady: false }
  })

  afterEach(() => {
    container.remove()
    consoleError.mockRestore()
  })

  it('monta, atualiza o projeto, desmonta e remonta em StrictMode sem cleanup inválido', async () => {
    const root = createRoot(container)
    await act(async () => {
      root.render(<StrictMode><MemoryRouter><AssistantPanel fullPage/></MemoryRouter></StrictMode>)
    })

    assistantState = {
      ...assistantState,
      projectReady: true,
      loading: true,
      messages: [{ id: 'question', role: 'user', content: 'Como está Produção?' }],
    }
    await act(async () => {
      root.render(<StrictMode><MemoryRouter><AssistantPanel fullPage/></MemoryRouter></StrictMode>)
    })
    await act(async () => root.unmount())

    const secondRoot = createRoot(container)
    await act(async () => {
      secondRoot.render(<StrictMode><MemoryRouter><AssistantPanel fullPage/></MemoryRouter></StrictMode>)
    })
    await act(async () => secondRoot.unmount())

    expect(consoleError).not.toHaveBeenCalled()
  })
})
