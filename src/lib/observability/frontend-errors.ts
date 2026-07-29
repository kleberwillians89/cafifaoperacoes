export type FrontendErrorRegion = 'global' | 'map' | 'indicators' | 'activity' | 'timeline' | 'assistant' | 'lazy-import'

type FrontendErrorInput = {
  error: unknown
  componentStack?: string | null
  region: FrontendErrorRegion
  occurrence?: 'navigation' | 'refresh' | 'refetch' | 'render'
}

const sanitize = (value: string, limit: number) => value
  .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
  .replace(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, '[redacted-jwt]')
  .slice(0, limit)

export function reportFrontendError({ error, componentStack, region, occurrence = 'render' }: FrontendErrorInput) {
  if (typeof window === 'undefined') return
  const item = error instanceof Error ? error : new Error('unknown_frontend_error')
  const payload = {
    error_name: sanitize(item.name || 'Error', 80),
    message: sanitize(item.message || 'unknown_frontend_error', 300),
    stack: sanitize(item.stack || '', 1_500),
    component_stack: sanitize(componentStack || '', 1_500),
    route: window.location.pathname,
    build_commit: typeof __BUILD_COMMIT__ === 'string' ? __BUILD_COMMIT__ : 'unknown',
    request_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    region,
    occurrence,
    browser: navigator.userAgent.slice(0, 240),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  }
  void fetch('/api/frontend-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined)
}
