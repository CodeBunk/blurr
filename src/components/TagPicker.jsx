import { useEffect, useState } from 'react'
import { useSession } from '../context/SessionProvider'
import { listFriendships } from '../lib/friends'

// Lets you tag people either from your accepted friends (resolves straight
// to a user_id, shows on their shelf immediately) or by typing a plain name
// (stays a guest tag until someone claims it — see ClaimPrompt).
export default function TagPicker({ tags, setTags }) {
  const { profile } = useSession()
  const [friends, setFriends] = useState([])
  const [guestName, setGuestName] = useState('')

  useEffect(() => {
    if (!profile) return
    listFriendships(profile.id).then((rows) =>
      setFriends(rows.filter((r) => r.status === 'accepted').map((r) => r.other))
    )
  }, [profile])

  const has = (t) => tags.some((x) => (x.userId ? x.userId === t.userId : x.name?.toLowerCase() === t.name?.toLowerCase()))

  const toggleFriend = (f) => {
    const t = { userId: f.id, label: f.display_name }
    if (has(t)) setTags(tags.filter((x) => x.userId !== f.id))
    else setTags([...tags, t])
  }

  const addGuest = () => {
    const name = guestName.trim()
    if (!name) return
    const t = { name, label: name }
    if (has(t)) return
    setTags([...tags, t])
    setGuestName('')
  }

  const remove = (t) => setTags(tags.filter((x) => x !== t))

  return (
    <div>
      {friends.length > 0 && (
        <div className="people" style={{ marginTop: 0, marginBottom: 11 }}>
          {friends.map((f) => {
            const active = tags.some((x) => x.userId === f.id)
            return (
              <button
                type="button"
                key={f.id}
                onClick={() => toggleFriend(f)}
                className="chip"
                style={active ? { borderColor: 'var(--ink)', background: 'var(--pearl)' } : undefined}
              >
                <span className="dot" style={{ width: 18, height: 18, fontSize: 9 }}>
                  {f.display_name[0].toUpperCase()}
                </span>
                {f.display_name}
              </button>
            )
          })}
        </div>
      )}
      <div className="row">
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGuest())}
            placeholder="or just type a name"
            autoComplete="off"
          />
        </div>
        <button type="button" className="btn" onClick={addGuest}>
          add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="people">
          {tags.map((t) => (
            <span key={t.userId || t.name} className="chip">
              <span className="dot" style={{ width: 18, height: 18, fontSize: 9 }}>
                {t.label[0].toUpperCase()}
              </span>
              {t.label}
              <button type="button" onClick={() => remove(t)}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
