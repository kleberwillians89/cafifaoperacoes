import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

type AuthValue = { session: Session | null; user: User | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    const client = supabase
    const load = async (next: Session | null) => {
      setSession(next)
      if (next?.user) {
        const { data } = await client.from('profiles').select('*').eq('id', next.user.id).maybeSingle()
        setProfile(data)
      } else setProfile(null)
      setLoading(false)
    }
    void client.auth.getSession().then(({ data }) => load(data.session))
    const { data } = client.auth.onAuthStateChange((_event, next) => { void load(next) })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(() => ({
    session, user: session?.user ?? null, profile, loading,
    signOut: async () => { if (supabase) await supabase.auth.signOut() },
  }), [session, profile, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return value
}
