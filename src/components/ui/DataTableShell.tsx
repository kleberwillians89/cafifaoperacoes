import type { ReactNode } from 'react'

export function DataTableShell({ children }: { children: ReactNode }) {
  return <div className="table-shell"><div className="table-shell__scroll">{children}</div></div>
}
