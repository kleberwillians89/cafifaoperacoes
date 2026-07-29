import { useState, type FormEvent } from 'react'
import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/AuthProvider'

function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="brand brand--light"><img className="brand__logo" src="/logocafifa.png" alt="Cafifa — movimento coletivo" /><span className="brand__product">Operações</span></div>
        <div><span>11 · OUT · 2026</span><h1>Operação clara.<br /><em>Execução em movimento.</em></h1><p>I Corrida de São Francisco<br />Fernando de Noronha</p></div>
        <small>Plataforma privada · acesso somente por convite</small>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p>
          {!isSupabaseConfigured && <div className="config-notice">Configure as variáveis do Supabase para ativar este fluxo. A interface permanece disponível para desenvolvimento.</div>}
          {children}
        </div>
      </section>
    </main>
  )
}

export function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (user) return <Navigate to="/app/dashboard" replace />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) { setError('Configure as variáveis do Supabase para entrar.'); return }
    const form = new FormData(event.currentTarget)
    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) })
    setLoading(false)
    if (authError) setError(authError.message)
    else navigate((location.state as { from?: string } | null)?.from ?? '/app/dashboard', { replace: true })
  }
  return (
    <AuthLayout eyebrow="Bem-vindo de volta" title="Acesse sua conta" description="Entre com o e-mail utilizado no convite da organização.">
      <form className="auth-form" onSubmit={submit}>
        <label><span>E-mail</span><div><Mail size={18} /><input name="email" type="email" autoComplete="email" placeholder="seu@email.com" required /></div></label>
        <label><span>Senha</span><div><LockKeyhole size={18} /><input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required /></div></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <Link className="forgot-link" to="/esqueci-senha">Esqueci minha senha</Link>
        <button className="primary-button auth-submit" disabled={loading} type="submit">{loading ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <p className="auth-footnote">Não possui acesso? Solicite um convite a um administrador.</p>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const email = String(new FormData(event.currentTarget).get('email'))
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` })
    setMessage(error?.message ?? 'Enviamos as instruções para o seu e-mail.')
  }
  return (
    <AuthLayout eyebrow="Recuperação de acesso" title="Esqueceu sua senha?" description="Informe seu e-mail para receber as instruções de recuperação.">
      <form className="auth-form" onSubmit={submit}>
        <label><span>E-mail</span><div><Mail size={18} /><input name="email" type="email" autoComplete="email" placeholder="seu@email.com" required /></div></label>
        {message && <p className="form-message">{message}</p>}
        <button className="primary-button auth-submit" type="submit">Enviar instruções</button>
      </form>
      <Link className="back-link" to="/login"><ArrowLeft size={16} /> Voltar para o login</Link>
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password')); const confirmation = String(form.get('confirmation'))
    if (password !== confirmation) { setError('As senhas não coincidem.'); return }
    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) setError(authError.message); else navigate('/app/dashboard', { replace: true })
  }
  return (
    <AuthLayout eyebrow="Nova senha" title="Redefina sua senha" description="Escolha uma senha segura para continuar.">
      <form className="auth-form" onSubmit={submit}>
        <label><span>Nova senha</span><div><LockKeyhole size={18} /><input name="password" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" minLength={8} required /></div></label>
        <label><span>Confirmar senha</span><div><LockKeyhole size={18} /><input name="confirmation" type="password" autoComplete="new-password" placeholder="Repita sua senha" minLength={8} required /></div></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button auth-submit" type="submit">Salvar nova senha</button>
      </form>
    </AuthLayout>
  )
}
