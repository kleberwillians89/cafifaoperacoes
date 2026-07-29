import { AlertTriangle, Calculator, ExternalLink, Lightbulb, SearchCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ChatMessage } from '../types'

const findingIcons = { fact: SearchCheck, calculation: Calculator, inference: AlertTriangle, recommendation: Lightbulb }
const routeFor = (type: string, id: string) => type === 'task' ? `/app/tarefas/${id}` : type === 'area' ? `/app/areas?area=${id}` : type === 'milestone' ? '/app/marcos' : type === 'risk' ? '/app/riscos' : '/app/arquivos'

export function AssistantMessage({ message, onSuggestion }: { message: ChatMessage; onSuggestion: (value: string) => void }) {
  if (message.role === 'user') return <div className="assistant-message assistant-message--user"><p>{message.content}</p></div>
  const answer = message.answer
  return <div className={`assistant-message assistant-message--assistant severity-${answer?.severity ?? 'info'} ${message.failed ? 'is-error' : ''}`}>
    {answer?.headline && <h3>{answer.headline}</h3>}<p>{message.content}</p>
    {answer?.facts.length ? <dl className="assistant-facts">{answer.facts.map((fact) => <div key={`${fact.label}-${fact.value}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : null}
    {answer?.findings.length ? <div className="assistant-findings">{answer.findings.map((finding, index) => { const Icon = findingIcons[finding.type]; return <div key={`${finding.type}-${index}`}><Icon size={15}/><span><small>{finding.type}</small>{finding.message}</span></div> })}</div> : null}
    {answer?.references.length ? <div className="assistant-references">{answer.references.map((reference) => <Link to={routeFor(reference.entity_type, reference.entity_id)} key={`${reference.entity_type}-${reference.entity_id}`}><ExternalLink size={13}/>{reference.label}</Link>)}</div> : null}
    {answer?.suggested_questions.length ? <div className="assistant-suggestions compact">{answer.suggested_questions.slice(0, 3).map((question) => <button onClick={() => onSuggestion(question)} key={question}>{question}</button>)}</div> : null}
  </div>
}
