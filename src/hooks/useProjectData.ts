import { useQuery } from '@tanstack/react-query'
import { getProjectData } from '@/features/core/core.service'
import { useProject } from '@/features/projects/ProjectProvider'

export function useProjectData() {
  const { project } = useProject()
  return useQuery({ queryKey: ['project-data', project?.id], enabled: Boolean(project), queryFn: () => getProjectData(project!.id) })
}
