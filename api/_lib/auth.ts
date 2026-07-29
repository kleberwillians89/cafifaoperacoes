import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database, Profile, Project, ProjectMember } from '../../src/types/database.js'

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export type AuthContext = {
  user: User
  profile: Profile
  membership: ProjectMember
  project: Project
  client: SupabaseClient<Database>
}

export async function authenticateRequest(authorization: string | undefined): Promise<AuthContext> {
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Sessão ausente ou inválida.')
  const token = authorization.slice(7).trim()
  if (!token) throw new HttpError(401, 'Sessão ausente ou inválida.')
  if (token.split('.').length !== 3) throw new HttpError(401, 'Sessão expirada ou inválida.')
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new HttpError(500, 'Configuração interna indisponível.')

  const authClient = createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) throw new HttpError(401, 'Sessão expirada ou inválida.')

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: profile, error: profileError } = await client.from('profiles').select('*').eq('id', authData.user.id).maybeSingle()
  if (profileError || !profile || profile.id !== authData.user.id) throw new HttpError(403, 'Perfil ativo não encontrado.')
  const { data: memberships, error: memberError } = await client.from('project_members').select('*').eq('user_id', authData.user.id).eq('active', true).limit(2)
  if (memberError || !memberships?.length) throw new HttpError(403, 'Usuário sem acesso ativo ao projeto.')
  const membership = memberships[0]
  const { data: project, error: projectError } = await client.from('projects').select('*').eq('id', membership.project_id).single()
  if (projectError || !project) throw new HttpError(403, 'Projeto não autorizado.')
  return { user: authData.user, profile, membership, project, client }
}
