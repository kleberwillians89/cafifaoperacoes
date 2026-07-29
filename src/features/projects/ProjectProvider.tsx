import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { requireSupabase } from '@/features/shared/requireSupabase'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Project, ProjectMember } from '@/types/database'
import { displayProjectName } from '@/lib/branding'

type ProjectValue = { project: Project | null; membership: ProjectMember | null; loading: boolean }
const ProjectContext = createContext<ProjectValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['active-project', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const client = requireSupabase()
      const { data: memberships, error } = await client.from('project_members').select('*').eq('user_id', user!.id).eq('active', true).order('joined_at', { ascending: true, nullsFirst: false }).order('id').limit(1)
      if (error) throw error
      if (!memberships.length) return { project: null, membership: null }
      const membership = memberships[0]
      const { data: project, error: projectError } = await client.from('projects').select('*').eq('id', membership.project_id).single()
      if (projectError) throw projectError
      return { project: { ...project, name: displayProjectName(project.name) }, membership }
    },
  })
  const value = useMemo(() => ({ project: query.data?.project ?? null, membership: query.data?.membership ?? null, loading: query.isLoading }), [query.data, query.isLoading])
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
  const value = useContext(ProjectContext)
  if (!value) throw new Error('useProject deve ser usado dentro de ProjectProvider')
  return value
}
