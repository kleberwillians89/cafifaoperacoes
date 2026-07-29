import { useEffect, useMemo, useRef, useState } from 'react'
import { Command, History, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjectData } from '@/hooks/useProjectData'
import { useOperationalRelations } from '@/features/operations/hooks/useOperationalRelations'

type Result = { id: string; label: string; detail: string; route: string; type: string }
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const project = useProjectData()
  const relations = useOperationalRelations()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 30)
    else setQuery('')
  }, [open])

  const results = useMemo(() => {
    if (!project.data || !relations.data || query.trim().length < 2) return []
    const needle = normalize(query)
    const { tasks, areas, milestones, risks } = project.data
    const profiles = new Map(relations.data.profiles.map((profile) => [profile.id, profile.full_name]))
    const items: Result[] = [
      ...areas.map((item) => ({ id: item.id, label: item.name, detail: 'Área operacional', route: `/app/areas/${item.id}`, type: 'Área' })),
      ...tasks.map((item) => ({ id: item.id, label: item.title, detail: `${areas.find((area) => area.id === item.area_id)?.name ?? 'Sem área'} · ${profiles.get(item.primary_responsible_user_id ?? '') ?? item.original_responsible_label ?? 'Sem responsável'}`, route: `/app/tarefas/${item.id}`, type: 'Tarefa' })),
      ...milestones.map((item) => ({ id: item.id, label: item.title, detail: item.milestone_date ?? 'Sem data', route: `/app/marcos/${item.id}`, type: 'Marco' })),
      ...risks.map((item) => ({ id: item.id, label: item.title, detail: item.status, route: `/app/riscos/${item.id}`, type: 'Risco' })),
      ...relations.data.comments.map((item) => ({ id: item.id, label: item.content, detail: 'Comentário', route: `/app/tarefas/${item.task_id}`, type: 'Comentário' })),
      ...relations.data.history.map((item) => ({ id: item.id, label: item.action, detail: tasks.find((task) => task.id === item.task_id)?.title ?? 'Histórico', route: `/app/tarefas/${item.task_id}`, type: 'Histórico' })),
      ...relations.data.profiles.map((item) => ({ id: item.id, label: item.full_name, detail: item.email, route: '/app/pessoas', type: 'Responsável' })),
    ]
    return items.filter((item) => normalize(`${item.label} ${item.detail} ${item.type}`).includes(needle)).slice(0, 30)
  }, [project.data, query, relations.data])

  if (!open) return null
  const select = (result: Result) => { navigate(result.route); onClose() }
  return <div className="command-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="command-palette" role="dialog" aria-modal="true" aria-label="Busca global">
      <header><Search size={19}/><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); if (event.key === 'Enter' && results[0]) select(results[0]) }} placeholder="Buscar área, tarefa, responsável, marco, risco ou histórico"/><button onClick={onClose} aria-label="Fechar busca"><X size={18}/></button></header>
      <div className="command-results">
        {!query.trim() && <div className="command-empty"><Command size={24}/><strong>Busca rápida da operação</strong><span>Digite ao menos dois caracteres. Pressione Enter para abrir o primeiro resultado.</span></div>}
        {query.trim().length >= 2 && !results.length && <div className="command-empty"><Search size={24}/><strong>Nenhum resultado encontrado</strong><span>A busca consulta somente os dados reais visíveis para seu usuário.</span></div>}
        {results.map((result) => <button onClick={() => select(result)} key={`${result.type}-${result.id}`}><i>{result.type === 'Histórico' ? <History size={16}/> : <Search size={16}/>}</i><span><strong>{result.label}</strong><small>{result.detail}</small></span><em>{result.type}</em></button>)}
      </div>
      <footer><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></footer>
    </section>
  </div>
}
