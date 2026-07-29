import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from './AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export function DevelopmentAuthGuard() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState />
  if (!isSupabaseConfigured || !user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Outlet />
}
