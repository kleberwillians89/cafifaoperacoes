import { PageHeader } from '@/components/layout/PageHeader'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'

export function AssistantPage() {
  return <><PageHeader eyebrow="Assistente CAFIFA" title="Central Operacional CAFIFA" description="Inteligência operacional para acompanhar tarefas, áreas, prazos, responsáveis, riscos e marcos do evento."/><AssistantPanel fullPage/></>
}
