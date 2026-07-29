import { useQuery } from '@tanstack/react-query'
import { useProject } from '@/features/projects/ProjectProvider'
import { getOperationalRelations } from '../services/operations.service'

export function useOperationalRelations() {
  const { project } = useProject()
  return useQuery({
    queryKey: ['operational-relations', project?.id],
    enabled: Boolean(project),
    queryFn: () => getOperationalRelations(project!.id),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}
