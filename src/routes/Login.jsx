import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return setError('Confirm your email first — check your inbox for the link we sent.')
      }
      return setError(error.message)
    }
    navigate(from, { replace: true })
  }

  const withGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your shelf.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
        </Field>
        <Field label="Password">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
        </Field>
        {error && <p style={{ color: '#B4231C', fontSize: 13.5 }}>{error}</p>}
        <button disabled={busy} className="cta-big" style={{ justifyContent: 'center', width: '100%', marginTop: 4 }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <Divider />
      <button onClick={withGoogle} className="btn" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
        Continue with Google
      </button>
      <p style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-2)' }}>
        New here?{' '}
        <Link to="/signup" style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--pearl)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: 32, boxShadow: '0 18px 40px rgba(0,0,0,.06)' }}>
        <div className="mark grad" style={{ marginBottom: 4 }}>
          Blurr
        </div>
        <h3 style={{ marginTop: 4 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.07em', color: 'var(--ink-3)', margin: '6px 0 22px' }}>
            {subtitle}
          </p>
        )}
        {!subtitle && <div style={{ marginBottom: 18 }} />}
        {children}
      </div>
    </div>
  )
}

export function Field({ label, right, children }) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label style={{ display: 'flex', justifyContent: 'space-between' }}>
        {label}
        {right}
      </label>
      {children}
    </div>
  )
}

export function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
      <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>or</span>
      <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
    </div>
  )
}

export const inputClass = ''
