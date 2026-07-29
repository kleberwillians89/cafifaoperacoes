import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { StageCard } from '@/components/ui/StageCard'
import { LoadingState } from '@/components/ui/LoadingState'
import { useProjectData } from '@/hooks/useProjectData'

export function StagesPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useProjectData()
  const stages = useMemo(() => data?.stages.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) ?? [], [data, search])
  if (isLoading) return <LoadingState />
  return <><PageHeader eyebrow="Cronograma oficial" title="Etapas" description="Da mobilização ao encerramento pós-evento." actions={<SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar etapa" />} />
    <div className="stage-list">{stages.map((stage) => { const tasks = data?.tasks.filter((t) => t.stage_id === stage.id) ?? []; const progress = Math.round(tasks.reduce((sum, t) => sum + t.completion_percentage, 0) / Math.max(tasks.length, 1)); return <StageCard key={stage.id} title={stage.name} period={stage.original_period_label ?? `${stage.start_date ?? 'A definir'} — ${stage.end_date ?? 'A definir'}`} count={tasks.length} progress={progress} /> })}</div>
  </>
}
