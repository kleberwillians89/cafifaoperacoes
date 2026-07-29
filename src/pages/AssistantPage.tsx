import { PageHeader } from '@/components/layout/PageHeader'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'

export function AssistantPage() {
  return <><PageHeader eyebrow="Inteligência operacional" title="Assistente CAFIFA" description="Cruze tarefas, áreas, prazos, riscos, marcos e evidências com dados reais do projeto."/><AssistantPanel fullPage/></>
}
