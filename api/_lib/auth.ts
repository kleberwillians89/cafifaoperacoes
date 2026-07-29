import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database, Profile, Project, ProjectMember } from '../../src/types/database.js'

export class HttpError extends Error {
  constructor(public status: number, message: string, public code = 'ASSISTANT_REQUEST_FAILED', public stage: 'auth' | 'project' | 'context' | 'openai' | 'parse' | 'response' = 'response') { super(message) }
}

export type AuthContext = {
  user: User
  profile: Profile
  membership: ProjectMember
  project: Project
  client: SupabaseClient<Database>
}

export async function authenticateRequest(authorization: string | undefined, activeProjectId: string): Promise<AuthContext> {
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Sessão ausente ou inválida.', 'ASSISTANT_SESSION_MISSING', 'auth')
  const token = authorization.slice(7).trim()
  if (!token) throw new HttpError(401, 'Sessão ausente ou inválida.', 'ASSISTANT_SESSION_MISSING', 'auth')
  if (token.split('.').length !== 3) throw new HttpError(401, 'Sessão expirada ou inválida.', 'ASSISTANT_SESSION_INVALID', 'auth')
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new HttpError(500, 'Configuração interna indisponível.', 'ASSISTANT_RESPONSE_INVALID', 'auth')

  const authClient = createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) throw new HttpError(401, 'Sessão expirada ou inválida.', 'ASSISTANT_SESSION_INVALID', 'auth')

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: profile, error: profileError } = await client.from('profiles').select('*').eq('id', authData.user.id).maybeSingle()
  if (profileError || !profile || profile.id !== authData.user.id || !profile.active) throw new HttpError(403, 'Perfil ativo não encontrado.', 'ASSISTANT_PROJECT_ACCESS_DENIED', 'project')
  const { data: membership, error: memberError } = await client.from('project_members').select('*').eq('user_id', authData.user.id).eq('project_id', activeProjectId).eq('active', true).maybeSingle()
  if (memberError || !membership) throw new HttpError(403, 'Seu usuário não possui acesso ao projeto selecionado.', 'ASSISTANT_PROJECT_ACCESS_DENIED', 'project')
  const { data: project, error: projectError } = await client.from('projects').select('*').eq('id', activeProjectId).single()
  if (projectError || !project) throw new HttpError(403, 'Projeto não autorizado.', 'ASSISTANT_PROJECT_ACCESS_DENIED', 'project')
  return { user: authData.user, profile, membership, project, client }
}
