import type { AssistantRequest, RoutedRequest } from './schemas.js'

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function routeContext(request: AssistantRequest): RoutedRequest {
  const query = normalize(request.message)
  const followUp = /^(e |e quem|e qual|e como|quem e|qual e|e os|e as)/.test(query) && request.previous?.intent
  if (followUp) return { intent: 'FOLLOW_UP', query: request.message, entityHint: request.previous?.entity_label ?? null, previous: request.previous }
  if (/(hoje|agora|atrasad|sem responsavel|preciso fazer)/.test(query)) return { intent: 'TODAY', query: request.message, entityHint: null, previous: request.previous }
  if (/(risco|ameaca|mitigacao|contingencia)/.test(query)) return { intent: 'RISK', query: request.message, entityHint: extractHint(request.message), previous: request.previous }
  if (/(resumo executivo|visao geral|areas em alerta|dia d|priorizad|esta semana|operacao inteira)/.test(query)) return { intent: 'EXECUTIVE', query: request.message, entityHint: null, previous: request.previous }
  if (/(marco|gate|checkpoint)/.test(query)) return { intent: 'MILESTONE', query: request.message, entityHint: extractHint(request.message), previous: request.previous }
  if (/(tarefa|entrega|atividade)/.test(query)) return { intent: 'TASK', query: request.message, entityHint: extractHint(request.message), previous: request.previous }
  if (/(area|producao|logistica|governanca|marketing|financeiro|seguranca|saude|percurso|inscricoes)/.test(query)) return { intent: 'AREA', query: request.message, entityHint: extractHint(request.message), previous: request.previous }
  return { intent: 'UNKNOWN', query: request.message, entityHint: extractHint(request.message), previous: request.previous }
}

function extractHint(message: string) {
  const quoted = message.match(/[“"']([^”"']+)[”"']/)?.[1]
  if (quoted) return quoted.trim()
  return message.replace(/[?!.]/g, '').replace(/^(como est[aá]|qual [ée]|mostre|quais|o que|como|sobre|a [aá]rea)\s+/i, '').trim() || null
}
