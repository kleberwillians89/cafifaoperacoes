import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, RotateCcw, Sparkles, X } from 'lucide-react'
import { AssistantMessage } from './AssistantMessage'
import { INITIAL_QUESTIONS, useAssistant } from '../hooks/useAssistant'

export function AssistantPanel({ fullPage = false, onClose }: { fullPage?: boolean; onClose?: () => void }) {
  const { messages, loading, send, retry } = useAssistant()
  const [input, setInput] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [messages, loading])
  function submit(event: FormEvent) { event.preventDefault(); const value = input; setInput(''); void send(value) }
  return <section className={`assistant-panel ${fullPage ? 'assistant-panel--page' : ''}`} aria-label="Assistente CAFIFA">
    <header><div className="assistant-identity"><i><Sparkles size={19}/></i><div><strong>Assistente CAFIFA</strong><span>Inteligência operacional · somente leitura</span></div></div>{onClose && <button onClick={onClose} aria-label="Fechar Assistente CAFIFA"><X size={20}/></button>}</header>
    <div className="assistant-conversation">
      {!messages.length && <div className="assistant-welcome"><span>Central Operacional CAFIFA</span><h2>Como posso ajudar na operação?</h2><p>Consulto tarefas, áreas, prazos, riscos, marcos e evidências respeitando seu acesso ao projeto.</p><div className="assistant-suggestions">{INITIAL_QUESTIONS.map((question) => <button onClick={() => void send(question)} key={question}>{question}</button>)}</div></div>}
      {messages.map((message) => <AssistantMessage message={message} onSuggestion={(value) => void send(value)} key={message.id}/>)}
      {loading && <div className="assistant-thinking"><span/><span/><span/> Cruzando dados da operação</div>}
      {messages.at(-1)?.failed && <button className="assistant-retry" onClick={retry}><RotateCcw size={14}/> Tentar novamente</button>}
      <div ref={bottom}/>
    </div>
    <form className="assistant-composer" onSubmit={submit}><textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={4_000} rows={2} placeholder="Pergunte sobre a operação…" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }}/><div><small>{input.length}/4.000</small><button disabled={!input.trim() || loading} aria-label="Enviar pergunta"><ArrowUp size={18}/></button></div></form>
  </section>
}
