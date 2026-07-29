import { useState } from 'react'
import { Bell, LogOut, Menu, Search } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProject } from '@/features/projects/ProjectProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from '@/features/shared/requireSupabase'
import { Link } from 'react-router-dom'
import { displayProjectName } from '@/lib/branding'

export function Header({ onOpenMenu, onOpenSearch }: { onOpenMenu: () => void; onOpenSearch: () => void }) {
  const { user, profile, signOut } = useAuth(); const { project, membership } = useProject(); const [open, setOpen] = useState(false); const client = useQueryClient()
  const notifications = useQuery({ queryKey: ['notifications', user?.id], enabled: Boolean(user), queryFn: async () => { const { data, error } = await requireSupabase().from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20); if (error) throw error; return data } })
  const markRead = useMutation({ mutationFn: async (id: string) => { const { error } = await requireSupabase().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id); if (error) throw error }, onSuccess: () => { client.invalidateQueries({ queryKey: ['notifications'] }); client.invalidateQueries({ queryKey: ['notifications-count'] }) } })
  return (
    <header className="app-header">
      <button className="icon-button menu-button" onClick={onOpenMenu} aria-label="Abrir menu"><Menu /></button>
      <div className="project-name"><span>Projeto ativo</span><strong>{displayProjectName(project?.name)}</strong></div>
      <div className="header-actions">
        <button className="header-search" onClick={onOpenSearch} type="button"><Search size={16}/><span>Buscar na operação</span><kbd>Ctrl K</kbd></button>
        <div className="notification-wrap"><button className="icon-button" onClick={() => setOpen(!open)} type="button" aria-label="Notificações"><Bell size={20} />{notifications.data?.some((n) => !n.read_at) && <i />}</button>{open && <div className="notification-menu"><header><strong>Notificações</strong><span>{notifications.data?.filter((n) => !n.read_at).length ?? 0} novas</span></header>{notifications.data?.length ? notifications.data.map((item) => <Link className={item.read_at ? '' : 'unread'} to={item.task_id ? `/app/tarefas/${item.task_id}` : '/app/dashboard'} onClick={() => { if (!item.read_at) markRead.mutate(item.id); setOpen(false) }} key={item.id}><strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.created_at).toLocaleString('pt-BR')}</small></Link>) : <p>Nenhuma notificação.</p>}</div>}</div>
        <div className="future-profile"><UserAvatar name={profile?.full_name || user?.email || 'Usuário'} /><div><strong>{profile?.full_name || 'Usuário'}</strong><span>{membership?.access_level ?? profile?.global_role}</span></div><button className="logout-button" onClick={() => signOut()} title="Sair"><LogOut size={15}/></button></div>
      </div>
    </header>
  )
}
