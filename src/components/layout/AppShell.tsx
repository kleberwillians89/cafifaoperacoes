import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileNavigation } from './MobileNavigation'
import { Sidebar } from './Sidebar'
import { AssistantLauncher } from '@/features/assistant/components/AssistantLauncher'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="app-shell">
      <div className="desktop-sidebar"><Sidebar /></div>
      <div className="app-column">
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className="app-content"><Outlet /></main>
      </div>
      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <AssistantLauncher />
    </div>
  )
}
