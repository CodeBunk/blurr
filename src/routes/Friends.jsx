import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useSession } from '../context/SessionProvider'
import { searchProfiles, listFriendships, sendFriendRequest, respondToRequest, removeFriendship } from '../lib/friends'

export default function Friends() {
  const { profile } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [friendships, setFriendships] = useState([])
  const [error, setError] = useState('')

  const load = () => profile && listFriendships(profile.id).then(setFriendships)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  useEffect(() => {
    const t = setTimeout(() => {
      if (profile) searchProfiles(query, profile.id).then(setResults).catch((e) => setError(e.message))
    }, 250)
    return () => clearTimeout(t)
  }, [query, profile])

  const accepted = friendships.filter((f) => f.status === 'accepted')
  const incoming = friendships.filter((f) => f.status === 'pending' && !f.iAmRequester)
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.iAmRequester)

  const request = async (id) => {
    await sendFriendRequest(profile.id, id)
    load()
  }

  return (
    <div>
      <Navbar />
      <main className="wrap" style={{ maxWidth: 640, paddingTop: 48, paddingBottom: 80 }}>
        <h2 className="grad" style={{ marginBottom: 22 }}>
          Friends
        </h2>

        <div className="field">
          <label>Find someone</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search by username or name" />
        </div>
        {error && <p style={{ color: '#B4231C', fontSize: 13 }}>{error}</p>}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, marginBottom: 24 }}>
            {results.map((r) => {
              const already = friendships.some((f) => f.other.id === r.id)
              return (
                <Row key={r.id}>
                  <span>
                    {r.display_name} <span className="q">@{r.username}</span>
                  </span>
                  {already ? <span className="q">already added</span> : <button className="btn" onClick={() => request(r.id)}>add</button>}
                </Row>
              )
            })}
          </div>
        )}

        {incoming.length > 0 && (
          <Group title="Requests">
            {incoming.map((f) => (
              <Row key={f.id}>
                <span>{f.other.display_name}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-solid"
                    onClick={async () => {
                      await respondToRequest(f.id, 'accepted')
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
              </Row>
            ))}
          </Group>
        )}

        {outgoing.length > 0 && (
          <Group title="Sent">
            {outgoing.map((f) => (
              <Row key={f.id}>
                <span>{f.other.display_name}</span>
                <span className="q">pending</span>
              </Row>
            ))}
          </Group>
        )}

        <Group title="Your friends">
          {accepted.length ? (
            accepted.map((f) => (
              <Row key={f.id}>
                <span>{f.other.display_name}</span>
                <button
                  className="btn"
                  onClick={async () => {
                    await removeFriendship(f.id)
                    load()
                  }}
                >
                  remove
                </button>
              </Row>
            ))
          ) : (
            <p className="none">No friends yet — search above to add some.</p>
          )}
        </Group>
      </main>
    </div>
  )
}

function Group({ title, children }) {
  return (
    <div className="sect" style={{ paddingTop: 26 }}>
      <div className="sect-head">
        <h3>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function Row({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 14.5,
      }}
    >
      {children}
    </div>
  )
}
