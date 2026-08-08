import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../context/SessionProvider'
import BottleGlyph from '../components/BottleGlyph'

// Public, no-login-required view of a single bottle via its share token.
export default function Share() {
  const { token } = useParams()
  const { session } = useSession()
  const [bottle, setBottle] = useState(undefined)
  const [canOpen, setCanOpen] = useState(false)

  useEffect(() => {
    supabase
      .rpc('get_shared_bottle', { share_token: token })
      .then(({ data }) => setBottle(data?.[0] || null))
  }, [token])

  // "open in Blurr" only makes sense if this visitor is actually the owner
  // or a tagged participant — anyone else hitting /b/:id would just bounce
  // off RLS with a raw error. Check for real access before offering it.
  useEffect(() => {
    if (!session || !bottle) return
    supabase
      .rpc('can_access_bottle', { bottle: bottle.id })
      .then(({ data }) => setCanOpen(!!data))
  }, [session, bottle])

  if (bottle === undefined) {
    return (
      <div style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.14em' }}>
        loading…
      </div>
    )
  }
  if (!bottle) {
    return (
      <div style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', color: 'var(--ink-3)', fontSize: 14, padding: 24, textAlign: 'center' }}>
        This link isn't valid anymore.
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: 32, textAlign: 'center', boxShadow: '0 18px 40px rgba(0,0,0,.06)' }}>
        <div className="mark grad" style={{ marginBottom: 22 }}>
          Blurr
        </div>
        <BottleGlyph skin={bottle.skin} photoUrl={bottle.photo_url} size={130} />
        <h1 className="grad" style={{ fontSize: 28, marginTop: 14 }}>
          {bottle.label}
        </h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 6 }}>
          {bottle.ml ? `${bottle.ml} ml` : ''}
          {bottle.cost ? ` · ${bottle.currency}${Number(bottle.cost).toLocaleString('en-IN')}` : ''}
        </p>

        {bottle.can_comment && !session && (
          <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 22 }}>
            Tagged on this one?{' '}
            <Link to="/signup" style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              Sign up
            </Link>{' '}
            and claim your version.
          </p>
        )}
        {session && canOpen && (
          <Link to={`/b/${bottle.id}`} className="btn btn-solid" style={{ display: 'inline-block', marginTop: 22 }}>
            open in Blurr
          </Link>
        )}
        {session && !canOpen && bottle.can_comment && (
          <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 22 }}>
            You're signed in, but not tagged on this one yet. Ask whoever added it to tag you — it'll open in your Blurr once you're a confirmed participant.
          </p>
        )}
      </div>
    </div>
  )
}
