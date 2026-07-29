import { NavLink } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { navigationItems } from './navigation'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header"><div className="brand"><img className="brand__logo" src="/logocafifa.png" alt="Cafifa — movimento coletivo" /><span className="brand__product">Operações</span></div></div>
      <nav className="sidebar__navigation" aria-label="Navegação principal">
        <span className="nav-label">Central de operações</span>
        {navigationItems.map(({ label, to, icon: Icon, adminOnly }) => (
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${adminOnly ? 'admin-link' : ''}`} key={to} to={to} onClick={onNavigate}>
            <Icon size={19} /><span>{label}</span>{adminOnly && <small>Admin</small>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer"><div className="event-card"><CalendarDays size={18} /><span>Evento em</span><strong>11 OUT 2026</strong><small>Fernando de Noronha</small></div></div>
    </aside>
  )
}
