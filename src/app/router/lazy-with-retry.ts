import type { ComponentType } from 'react'
import { reportFrontendError } from '@/lib/observability/frontend-errors'

const RELOAD_KEY = 'cafifa:chunk-reload'

export async function loadNamedPage<T extends Record<string, unknown>>(importer: () => Promise<T>, exportName: keyof T) {
  const storage = typeof sessionStorage === 'undefined' ? null : sessionStorage
  try {
    const module = await importer()
    const page = module[exportName]
    if (typeof page !== 'function' && (typeof page !== 'object' || page === null)) throw new TypeError(`Invalid lazy page export: ${String(exportName)}`)
    storage?.removeItem(RELOAD_KEY)
    return { default: page as ComponentType }
  } catch (error) {
    reportFrontendError({ error, region: 'lazy-import', occurrence: 'navigation' })
    if (storage && !storage.getItem(RELOAD_KEY) && isChunkLoadError(error)) {
      storage.setItem(RELOAD_KEY, new Date().toISOString())
      window.location.reload()
      return new Promise<never>(() => undefined)
    }
    storage?.removeItem(RELOAD_KEY)
    throw error
  }
}

export function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(message)
}
