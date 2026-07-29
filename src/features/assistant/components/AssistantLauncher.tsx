import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AssistantPanel } from './AssistantPanel'

export function AssistantLauncher() {
  const [open, setOpen] = useState(false)
  return <><button className="assistant-launcher" onClick={() => setOpen(true)} aria-label="Abrir Assistente CAFIFA"><Sparkles size={21}/><span>Assistente CAFIFA</span></button>{open && <div className="assistant-overlay" onMouseDown={() => setOpen(false)}><div onMouseDown={(event) => event.stopPropagation()}><AssistantPanel onClose={() => setOpen(false)}/></div></div>}</>
}
