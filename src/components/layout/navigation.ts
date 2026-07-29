import {
  Archive, CalendarDays, CircleGauge, Flag, FolderOpen, History, LayoutList,
  Map, Settings, ShieldCheck, Users, TriangleAlert, BriefcaseBusiness, type LucideIcon,
} from 'lucide-react'

export type NavigationItem = { label: string; to: string; icon: LucideIcon; adminOnly?: boolean }

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: CircleGauge },
  { label: 'Projeto', to: '/app/projeto', icon: BriefcaseBusiness },
  { label: 'Minhas tarefas', to: '/app/minhas-tarefas', icon: LayoutList },
  { label: 'Todas as tarefas', to: '/app/tarefas', icon: Archive },
  { label: 'Etapas', to: '/app/etapas', icon: Map },
  { label: 'Pessoas', to: '/app/pessoas', icon: Users },
  { label: 'Áreas', to: '/app/areas', icon: ShieldCheck },
  { label: 'Marcos', to: '/app/marcos', icon: Flag },
  { label: 'Riscos', to: '/app/riscos', icon: TriangleAlert },
  { label: 'Calendário', to: '/app/calendario', icon: CalendarDays },
  { label: 'Arquivos', to: '/app/arquivos', icon: FolderOpen },
  { label: 'Histórico', to: '/app/historico', icon: History },
  { label: 'Administração', to: '/app/administracao', icon: Settings, adminOnly: true },
]
