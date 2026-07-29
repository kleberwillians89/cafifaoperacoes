import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, BriefcaseBusiness, RotateCcw, Sparkles, X } from 'lucide-react'
import { AssistantMessage } from './AssistantMessage'
import { INITIAL_QUESTIONS, useAssistant } from '../hooks/useAssistant'

export function AssistantPanel({ fullPage = false, onClose }: { fullPage?: boolean; onClose?: () => void }) {
  const { messages, loading, slow, projectReady, send, retry } = useAssistant()
  const [input, setInput] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])
  function submit(event: FormEvent) { event.preventDefault(); const value = input; void send(value).then((accepted) => { if (accepted) setInput('') }) }
  return <section className={`assistant-panel ${fullPage ? 'assistant-panel--page' : ''}`} aria-label="Assistente Santo Circuito">
    <header><div className="assistant-identity"><i><Sparkles size={19}/></i><div><strong>Assistente Santo Circuito</strong><span>Direção operacional · somente leitura</span></div></div><div className="assistant-header-actions"><button className="assistant-diagnostic" onClick={() => void send('Gere o Diagnóstico Executivo completo da operação: resumo, prioridades, riscos, recomendações, próximas ações e probabilidade de sucesso com base somente nos dados registrados.')} disabled={loading}><BriefcaseBusiness size={15}/><span>Diagnóstico Executivo</span></button>{onClose && <button onClick={onClose} aria-label="Fechar Assistente Santo Circuito"><X size={20}/></button>}</div></header>
    <div className="assistant-conversation">
      <div className="assistant-welcome"><span>Diretor de Operações Santo Circuito</span><h2>Decisões baseadas na operação real</h2><p>Prioridades, responsáveis, riscos, marcos e próximos passos com origem verificável.</p>{!messages.length && <div className="assistant-suggestions">{INITIAL_QUESTIONS.map((question) => <button onClick={() => void send(question)} key={question}>{question}</button>)}</div>}</div>
      {messages.map((message) => <AssistantMessage message={message} onSuggestion={(value) => void send(value)} key={message.id}/>)}
      {loading && <div className="assistant-thinking"><span/><span/><span/> Cruzando dados da operação</div>}
      {slow && <div className="assistant-slow" role="status">A análise está levando mais tempo que o normal.</div>}
      {messages.at(-1)?.failed && <button className="assistant-retry" onClick={retry}><RotateCcw size={14}/> Tentar novamente</button>}
      <div ref={bottom}/>
    </div>
    <form className="assistant-composer" onSubmit={submit}><textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={4_000} rows={2} placeholder="Pergunte sobre a operação…" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }}/><div><small>{input.length}/4.000</small><button disabled={!projectReady || !input.trim() || loading} aria-label="Enviar pergunta"><ArrowUp size={18}/></button></div></form>
  </section>
}
