import { DrawerShell } from '@/components/ui/DrawerShell'
import { Sidebar } from './Sidebar'

export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <DrawerShell open={open} title="Menu principal" onClose={onClose}><Sidebar onNavigate={onClose} /></DrawerShell>
}
