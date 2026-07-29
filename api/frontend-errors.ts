import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'

const FrontendErrorSchema = z.object({
  error_name: z.string().max(80),
  message: z.string().max(300),
  stack: z.string().max(1_500),
  component_stack: z.string().max(1_500),
  route: z.string().max(200),
  build_commit: z.string().max(80),
  request_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  region: z.enum(['global', 'map', 'indicators', 'activity', 'timeline', 'assistant', 'lazy-import']),
  occurrence: z.enum(['navigation', 'refresh', 'refetch', 'render']),
  browser: z.string().max(240),
  viewport: z.string().regex(/^\d{1,5}x\d{1,5}$/),
})

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  const parsed = FrontendErrorSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Diagnóstico inválido.' })
  console.error(JSON.stringify({ type: 'frontend_error', ...parsed.data }))
  return res.status(202).json({ accepted: true, request_id: parsed.data.request_id })
}
