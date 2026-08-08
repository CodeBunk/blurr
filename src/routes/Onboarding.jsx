import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../context/SessionProvider'
import { AuthShell, Field } from './Login'
import { cleanUsername, usernameError } from '../lib/validation'

// Reached after Google sign-in (which skips the username step in Signup),
// or as a fallback if a profile somehow still has its generated defaults.
export default function Onboarding() {
  const { user, profile, refreshProfile } = useSession()
  const [username, setUsername] = useState(profile?.username?.startsWith('user_') ? '' : profile?.username || '')
  const [displayName, setDisplayName] = useState(
    profile?.display_name && profile.display_name !== 'New user' ? profile.display_name : ''
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const clean = cleanUsername(username)
    const uErr = usernameError(clean)
    if (uErr) return setError(uErr)
    if (!displayName.trim()) return setError('Add a name people will recognize you by.')

    setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username: clean, display_name: displayName.trim() })
      .eq('id', user.id)
    setBusy(false)
    if (error) return setError(error.code === '23505' ? 'That username is taken.' : error.message)
    await refreshProfile()
    navigate('/', { replace: true })
  }

  return (
    <AuthShell title="Set up your profile" subtitle="This is how glass mates will find and tag you.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Display name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Rahul" />
        </Field>
        <Field label="Username">
          <input value={username} onChange={(e) => setUsername(cleanUsername(e.target.value))} placeholder="rahul" />
        </Field>
        {error && <p style={{ color: '#B4231C', fontSize: 13.5 }}>{error}</p>}
        <button disabled={busy} className="cta-big" style={{ justifyContent: 'center', width: '100%', marginTop: 4 }}>
          {busy ? 'Saving…' : 'Enter Blurr'}
        </button>
      </form>
    </AuthShell>
  )
}
