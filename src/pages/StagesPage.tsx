import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { StageCard } from '@/components/ui/StageCard'
import { LoadingState } from '@/components/ui/LoadingState'
import { useProjectData } from '@/hooks/useProjectData'
import { OperationalTaskRow } from '@/components/operations/OperationalTaskRow'
import { useOperationalRelations } from '@/features/operations/hooks/useOperationalRelations'

export function StagesPage() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const { data, isLoading } = useProjectData()
  const relations = useOperationalRelations()
  const stages = useMemo(() => data?.stages.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) ?? [], [data, search])
  if (isLoading) return <LoadingState />
  return <><PageHeader eyebrow="Cronograma oficial" title="Etapas" description="Da mobilização ao encerramento pós-evento." actions={<SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar etapa" />} />
    <div className="stage-list">{stages.map((stage) => { const tasks = data?.tasks.filter((t) => t.stage_id === stage.id) ?? []; const progress = Math.round(tasks.reduce((sum, t) => sum + t.completion_percentage, 0) / Math.max(tasks.length, 1)); const open = expanded.has(stage.id); return <StageCard key={stage.id} id={stage.id} title={stage.name} period={stage.original_period_label ?? `${stage.start_date ?? 'A definir'} — ${stage.end_date ?? 'A definir'}`} count={tasks.length} progress={progress} expanded={open} onToggle={() => setExpanded((current) => { const next = new Set(current); if (next.has(stage.id)) next.delete(stage.id); else next.add(stage.id); return next })}>{tasks.map((task) => <OperationalTaskRow task={task} stage={stage} area={data?.areas.find((area) => area.id === task.area_id)} responsible={relations.data?.profiles.find((profile) => profile.id === task.primary_responsible_user_id)} key={task.id}/>)}</StageCard> })}</div>
  </>
}
