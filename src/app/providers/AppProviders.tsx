import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProjectProvider } from '@/features/projects/ProjectProvider'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } })

export function AppProviders({ children }: { children: ReactNode }) {
  return <AppErrorBoundary><QueryClientProvider client={queryClient}><AuthProvider><ProjectProvider><BrowserRouter>{children}</BrowserRouter></ProjectProvider></AuthProvider></QueryClientProvider></AppErrorBoundary>
}
