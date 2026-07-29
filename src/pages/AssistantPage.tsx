import { PageHeader } from '@/components/layout/PageHeader'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'

export function AssistantPage() {
  return <><PageHeader eyebrow="Assistente Santo Circuito" title="Central Operacional Santo Circuito" description="Inteligência operacional para acompanhar tarefas, áreas, prazos, responsáveis, riscos e marcos do evento."/><AssistantPanel fullPage/></>
}
