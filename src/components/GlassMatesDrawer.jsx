import { useEffect, useState } from 'react'
import { useSession } from '../context/SessionProvider'
import { useChrome } from '../context/ChromeProvider'
import { searchProfiles, listFriendships, sendFriendRequest, respondToRequest, removeFriendship } from '../lib/friends'
import { Audio2 } from '../lib/audio'

// Glass mates as a slide-over panel, reachable from any page, instead of a
// full-page route — same content as the old /friends page, just doesn't
// take you away from whatever you were doing.
export default function GlassMatesDrawer() {
  const { mateDrawerOpen, setMateDrawerOpen } = useChrome()
  const { profile } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [friendships, setFriendships] = useState([])
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  const load = () => profile && listFriendships(profile.id).then(setFriendships)

  useEffect(() => {
    if (mateDrawerOpen) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mateDrawerOpen, profile])

  useEffect(() => {
    if (!mateDrawerOpen) return
    const t = setTimeout(() => {
      if (profile) searchProfiles(query, profile.id).then(setResults).catch((e) => setError(e.message))
    }, 250)
    return () => clearTimeout(t)
  }, [query, profile, mateDrawerOpen])

  const accepted = friendships.filter((f) => f.status === 'accepted')
  const incoming = friendships.filter((f) => f.status === 'pending' && !f.iAmRequester)
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.iAmRequester)

  const request = async (id) => {
    await sendFriendRequest(profile.id, id)
    Audio2.click()
    load()
  }

  return (
    <>
      <div id="drawer-scrim" className={mateDrawerOpen ? 'on' : ''} onClick={() => setMateDrawerOpen(false)} />
      <aside className={`drawer${mateDrawerOpen ? ' on' : ''}`} aria-label="glass mates">
        <h4>Glass mates</h4>
        <button className="close" aria-label="close" onClick={() => setMateDrawerOpen(false)}>
          ✕
        </button>

        <div className="dgroup">
          <div className="lab">Find someone</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search by username or name"
            style={{
              width: '100%',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '9px 12px',
              fontSize: 13.5,
              background: 'var(--card)',
            }}
          />
          {error && <p style={{ color: '#B4231C', fontSize: 12.5, marginTop: 8 }}>{error}</p>}
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {results.map((r) => {
                const already = friendships.some((f) => f.other.id === r.id)
                return (
                  <MateRow key={r.id}>
                    <span>
                      {r.display_name} <span className="q">@{r.username}</span>
                    </span>
                    {already ? (
                      <span className="q">already added</span>
                    ) : (
                      <button className="btn" onClick={() => request(r.id)}>
                        add
                      </button>
                    )}
                  </MateRow>
                )
              })}
            </div>
          )}
        </div>

        {incoming.length > 0 && (
          <div className="dgroup">
            <div className="lab">Requests</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {incoming.map((f) => (
                <MateRow key={f.id}>
                  <span>{f.other.display_name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-solid"
                      onClick={async () => {
                        await respondToRequest(f.id, 'accepted')
                        Audio2.chime()
                        load()
                      }}
                    >
                      accept
                    </button>
                    <button
                      className="btn"
                      onClick={async () => {
                        await removeFriendship(f.id)
                        load()
                      }}
                    >
                      decline
                    </button>
                  </div>
                </MateRow>
              ))}
            </div>
          </div>
        )}

        {outgoing.length > 0 && (
          <div className="dgroup">
            <div className="lab">Sent</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {outgoing.map((f) => (
                <MateRow key={f.id}>
                  <span>{f.other.display_name}</span>
                  <span className="q">pending</span>
                </MateRow>
              ))}
            </div>
          </div>
        )}

        <div className="dgroup">
          <div className="lab">Your glass mates{accepted.length ? ` (${accepted.length})` : ''}</div>
          {accepted.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {accepted.map((f) => (
                <MateRow key={f.id} className="mate-row">
                  <span>{f.other.display_name}</span>
                  {confirmingId === f.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="q" style={{ fontSize: 11 }}>
                        sure?
                      </span>
                      <button
                        className="btn"
                        style={{ color: '#B4231C', borderColor: '#B4231C' }}
                        onClick={async () => {
                          await removeFriendship(f.id)
                          setConfirmingId(null)
                          load()
                        }}
                      >
                        remove
                      </button>
                      <button className="btn" onClick={() => setConfirmingId(null)}>
                        keep
                      </button>
                    </div>
                  ) : (
                    <button className="btn mate-remove" onClick={() => setConfirmingId(f.id)}>
                      remove
                    </button>
                  )}
                </MateRow>
              ))}
            </div>
          ) : (
            <p className="none">No glass mates yet — search above to add some.</p>
          )}
        </div>
      </aside>
    </>
  )
}

function MateRow({ children, className }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '9px 12px',
        fontSize: 13.5,
      }}
    >
      {children}
    </div>
  )
}
