import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { AuthShell, Field, Divider } from './Login'
import { cleanUsername, usernameError, passwordChecks, passwordIsStrong } from '../lib/validation'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState('') // '' | 'checking' | 'taken' | 'free'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touchedPw, setTouchedPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('') // set once signup succeeds -> shows "check your email"

  const uErr = username ? usernameError(username) : ''

  useEffect(() => {
    if (!username || uErr) {
      setUsernameStatus('')
      return
    }
    setUsernameStatus('checking')
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_username_taken', { check_username: username })
      if (error) return setUsernameStatus('')
      setUsernameStatus(data ? 'taken' : 'free')
    }, 350)
    return () => clearTimeout(t)
  }, [username, uErr])

  const withGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setTouchedPw(true)

    if (uErr) return setError(uErr)
    if (usernameStatus === 'taken') return setError('That username is already taken.')
    if (!passwordIsStrong(password)) return setError('Password needs to meet all the requirements below.')

    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        // Explicit, so the confirmation link always points at wherever
        // this build is actually running — not whatever the Supabase
        // dashboard's Site URL happens to be set to at the time.
        emailRedirectTo: window.location.origin,
      },
    })
    setBusy(false)
    if (error) return setError(error.message)

    // If email confirmation is off, Supabase returns a session immediately
    // and there's nothing to wait on — App routing takes it from there.
    if (data.session) return
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email">
        <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          We sent a confirmation link to <b style={{ color: 'var(--ink)' }}>{sentTo}</b>. Confirm your
          email to sign in — the link expires after a while, so do it soon.
        </p>
        <p style={{ marginTop: 18, fontSize: 13.5, color: 'var(--ink-3)' }}>
          Wrong address, or no email showing up?{' '}
          <button onClick={() => setSentTo('')} style={{ textDecoration: 'underline', textUnderlineOffset: 2, color: 'var(--ink)' }}>
            try again
          </button>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" subtitle="Your own shelf, your own name.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="Username"
          right={
            username &&
            !uErr && (
              <span style={{ fontSize: 9, color: usernameStatus === 'taken' ? '#B4231C' : usernameStatus === 'free' ? '#3C7A3C' : 'var(--ink-3)' }}>
                {usernameStatus === 'checking' ? 'checking…' : usernameStatus === 'taken' ? 'taken' : usernameStatus === 'free' ? 'available' : ''}
              </span>
            )
          }
        >
          <input
            value={username}
            onChange={(e) => setUsername(cleanUsername(e.target.value))}
            placeholder="rahul"
            autoComplete="username"
          />
        </Field>
        {username && uErr && <p style={{ color: '#B4231C', fontSize: 12.5, marginTop: -10 }}>{uErr}</p>}

        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>

        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setTouchedPw(true)}
            autoComplete="new-password"
          />
        </Field>
        {(touchedPw || password) && (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: -10, marginBottom: 0 }}>
            {passwordChecks(password).map((c) => (
              <li key={c.label} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: c.ok ? '#3C7A3C' : 'var(--ink-3)' }}>
                {c.ok ? '✓' : '·'} {c.label}
              </li>
            ))}
          </ul>
        )}

        {error && <p style={{ color: '#B4231C', fontSize: 13.5 }}>{error}</p>}

        <button disabled={busy} className="cta-big" style={{ justifyContent: 'center', width: '100%', marginTop: 4 }}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <Divider />
      <button onClick={withGoogle} className="btn" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
        Continue with Google
      </button>
      <p style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-2)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
