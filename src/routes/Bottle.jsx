import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import TagPicker from '../components/TagPicker'
import BottleGlyph from '../components/BottleGlyph'
import { useSession } from '../context/SessionProvider'
import { supabase } from '../lib/supabaseClient'
import { getBottle, saveStory, addSnap, addTag, createShareLink, deleteBottle, updateBottle } from '../lib/bottles'
import { shrink } from '../lib/resize'
import { copyText } from '../lib/clipboard'
import ShareButton from '../components/ShareButton'
import { Audio2 } from '../lib/audio'

export default function Bottle() {
  const { id } = useParams()
  const { profile } = useSession()
  const navigate = useNavigate()
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [storyOpen, setStoryOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [justShared, setJustShared] = useState(false)

  const load = useCallback(() => {
    getBottle(id).then(setState).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const channel = supabase
      .channel(`bottle:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bottle_stories', filter: `bottle_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bottle_snaps', filter: `bottle_id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bottle_participants', filter: `bottle_id=eq.${id}` }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id, load])

  const flash = (m) => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }

  if (error) return <ErrorScreen message={error} />
  if (!state) return <LoadingScreen />

  const { bottle, participants, stories, snaps } = state
  const isOwner = bottle.owner_id === profile.id
  const storyFor = (p) => stories.find((s) => s.participant_id === p.id)

  const markShared = () => {
    setJustShared(true)
    setTimeout(() => setJustShared(false), 2200)
  }

  const share = async () => {
    let link
    try {
      link = await createShareLink(bottle.id, profile.id, true)
    } catch {
      flash("couldn't create a share link")
      return
    }
    const url = `${window.location.origin}/share/${link.token}`

    if (navigator.share) {
      try {
        await navigator.share({ title: bottle.label, url })
        markShared()
        return
      } catch {
        // cancelled, or the OS share sheet isn't available — fall through to clipboard
      }
    }

    const copied = await copyText(url)
    flash(copied ? 'share link copied' : url)
    if (copied) markShared()
  }

  const removeBottle = async () => {
    if (!confirm('Trash this bottle?')) return
    await deleteBottle(bottle.id)
    navigate('/')
  }

  const uploadSnap = async (file) => {
    const dataUrl = await shrink(file, 1100, 0.72)
    await addSnap(bottle.id, dataUrl, profile.id)
    load()
    flash('snap added')
  }

  return (
    <div>
      <Navbar />
      <section id="night-view" className="on" aria-live="polite">
        <div className="fixed top-20 left-6 z-50" style={{ padding: '0 10px' }}>
          <button
            className="back-link"
            onClick={() => {
              Audio2.click()
              navigate('/')
            }}
            onPointerEnter={() => Audio2.hover()}
          >
            ← the shelf
          </button>
        </div>
        <div className="stage">
          {bottle.date && (
            <div className="date">{new Date(bottle.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            <h2 className="grad" style={{ margin: 0 }}>
              {bottle.label}
            </h2>
            <ShareButton onShare={share} shared={justShared} />
          </div>
          <div className="kind">
            {bottle.ml ? `${bottle.ml} ml` : ''}
            {bottle.ml && participants.length ? ' · ' : ''}
            {participants.length ? `${participants.length} present` : ''}
          </div>
          <div className="focus">
            <BottleGlyph skin={bottle.skin} photoUrl={bottle.photo_url} size={Math.round(window.innerHeight * 0.36)} />
          </div>
          <div className="surface" />
        </div>

        <div className="wrap">
          {(bottle.cost > 0 || bottle.extras?.length > 0) && (
            <div className="sect" style={{ animationDelay: '90ms' }}>
              <div className="sect-head">
                <h3>The setup</h3>
                <span>{participants.length ? `split ${participants.length} ways` : 'no one tagged'}</span>
              </div>
              <div className="receipt">
                <div className="r-top">Blurr · Bottle Record</div>
                <div className="r-title">{bottle.label}</div>
                {bottle.date && <div className="r-top">{new Date(bottle.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</div>}
                <div className="rule" />
                <div className="li">
                  <span>{bottle.label} {bottle.ml ? <span className="q">{bottle.ml} ml</span> : null}</span>
                  <span>{bottle.currency}{Number(bottle.cost).toLocaleString('en-IN')}</span>
                </div>
                {(bottle.extras || []).map((x, i) => (
                  <div className="li" key={i}>
                    <span>{x.name}</span>
                    <span>{bottle.currency}{Number(x.amt).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="rule" />
                <div className="total">
                  <span>ESTIMATED TOTAL</span>
                  <span>
                    {bottle.currency}
                    {(Number(bottle.cost) + (bottle.extras || []).reduce((s, x) => s + (Number(x.amt) || 0), 0)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="r-foot" style={{ margin: '-6px 0 4px', textAlign: 'left' }}>
                  bottle price + extras, as entered — not a synced real receipt
                </div>
                {participants.length > 0 && (
                  <>
                    <div className="li">
                      <span className="q">Heads</span>
                      <span className="q">{participants.length}</span>
                    </div>
                    <div className="split">
                      <span>EACH, ESTIMATED</span>
                      <span>
                        {bottle.currency}
                        {(
                          (Number(bottle.cost) + (bottle.extras || []).reduce((s, x) => s + (Number(x.amt) || 0), 0)) /
                          participants.length
                        ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
                <div className="rule" />
                <div className="li">
                  <span className="q">Statements</span>
                  <span className="q">{stories.length}{participants.length ? ' / ' + participants.length : ''}</span>
                </div>
                <div className="li">
                  <span className="q">Snaps filed</span>
                  <span className="q">{snaps.length}</span>
                </div>
                <div className="barcode" />
                <div className="r-foot">no refunds · no regrets</div>
              </div>
            </div>
          )}

          <div className="sect" style={{ animationDelay: '180ms' }}>
            <div className="sect-head">
              <h3>The scenes</h3>
              <span>{snaps.length} snap{snaps.length === 1 ? '' : 's'}</span>
            </div>
            {snaps.length ? (
              <div className="gallery">
                {snaps.map((s, i) => (
                  <figure className="snap" key={s.id} style={{ animationDelay: `${i * 55}ms` }}>
                    <img src={s.storage_path} alt="" loading="lazy" />
                  </figure>
                ))}
              </div>
            ) : (
              <p className="none">Nobody's uploaded anything. Suspicious.</p>
            )}
          </div>

          <div className="sect" style={{ animationDelay: '270ms' }}>
            <div className="sect-head">
              <h3>Notes from everyone</h3>
              <span>{participants.length ? `one night, ${participants.length} version${participants.length === 1 ? '' : 's'}` : ''}</span>
            </div>
            {participants.length ? (
              <div className="notes">
                {participants.map((p, i) => {
                  const story = storyFor(p)
                  const name = p.guest_name || 'Someone'
                  const mine = p.user_id === profile.id
                  const told = !!story?.body?.trim()
                  return (
                    <article className={`note${told ? '' : ' blank'}`} key={p.id} style={{ animationDelay: `${i * 70}ms` }}>
                      <div className="who">
                        <span className="dot">{name[0].toUpperCase()}</span>
                        <b>{p.user_id ? name : `${name} · unclaimed`}</b>
                      </div>
                      <p>{told ? story.body : `${name} hasn't written theirs yet. The night stays half-remembered until they do.`}</p>
                      {mine && (
                        <button
                          onClick={() => setStoryOpen(p.id)}
                          style={{ marginTop: 10, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', textDecoration: 'underline', textUnderlineOffset: 2 }}
                        >
                          {told ? 'edit your version' : '+ add your version'}
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="none">Nobody's tagged on this bottle. Add people to collect their versions.</p>
            )}
            <div className="actions-row">
              <label className="btn">
                + add snaps
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && uploadSnap(e.target.files[0])} />
              </label>
              {isOwner && (
                <>
                  <button className="btn" onClick={() => setEditOpen(true)}>
                    edit
                  </button>
                  <button className="btn" onClick={() => setTagOpen(true)}>
                    + tag someone
                  </button>
                  <button className="btn" onClick={removeBottle} style={{ color: '#B4231C' }}>
                    trash
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {storyOpen && (
        <StoryModal
          existing={stories.find((s) => s.participant_id === storyOpen)}
          onClose={() => setStoryOpen(false)}
          onSave={async (body) => {
            const existing = stories.find((s) => s.participant_id === storyOpen)
            await saveStory(bottle.id, storyOpen, body, existing?.id)
            setStoryOpen(false)
            load()
          }}
        />
      )}

      {editOpen && (
        <EditBottleModal
          bottle={bottle}
          onClose={() => setEditOpen(false)}
          onSave={async (patch) => {
            await updateBottle(bottle.id, patch)
            setEditOpen(false)
            load()
            flash('updated')
          }}
        />
      )}

      {tagOpen && (
        <TagModal
          onClose={() => setTagOpen(false)}
          onSave={async (tags) => {
            for (const t of tags) await addTag(bottle.id, t, profile.id)
            setTagOpen(false)
            load()
          }}
        />
      )}

      <div className={`toast${toast ? ' on' : ''}`}>{toast}</div>
    </div>
  )
}

function StoryModal({ existing, onClose, onSave }) {
  const [text, setText] = useState(existing?.body || '')
  const [busy, setBusy] = useState(false)
  return (
    <Modal title="Your version" subtitle="Same night, your side of it. Nobody edits anybody else's." onClose={onClose}>
      <div className="field">
        <label>What you remember</label>
        <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="we said one drink…" />
        <p className="help">Goes on a note at the bottom of the page. Rewrite it any time.</p>
      </div>
      <div className="actions">
        <button className="btn" onClick={onClose}>
          cancel
        </button>
        <button
          className="btn btn-solid"
          disabled={busy || !text.trim()}
          onClick={async () => {
            setBusy(true)
            await onSave(text.trim())
            setBusy(false)
          }}
        >
          sign it
        </button>
      </div>
    </Modal>
  )
}

function EditBottleModal({ bottle, onClose, onSave }) {
  const [label, setLabel] = useState(bottle.label)
  const [date, setDate] = useState(bottle.date || '')
  const [currency, setCurrency] = useState(bottle.currency || '₹')
  const [cost, setCost] = useState(bottle.cost || '')
  const [extras, setExtras] = useState(bottle.extras?.length ? bottle.extras.map((x) => ({ name: x.name, amt: x.amt })) : [])
  const [busy, setBusy] = useState(false)

  const addExtra = () => setExtras([...extras, { name: '', amt: '' }])
  const updateExtra = (i, field, value) => setExtras(extras.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)))
  const removeExtra = (i) => setExtras(extras.filter((_, idx) => idx !== i))

  const submit = async (e) => {
    e.preventDefault()
    if (!label.trim()) return
    setBusy(true)
    try {
      await onSave({
        label: label.trim(),
        date: date || null,
        currency,
        cost: Number(cost) || 0,
        extras: extras.filter((x) => x.name.trim() || Number(x.amt)).map((x) => ({ name: x.name.trim() || '—', amt: Number(x.amt) || 0 })),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Edit the night" subtitle="Change the name, date, or price." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Name of the night</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ border: 'none', borderBottom: '1px solid var(--line)', padding: '8px 0', fontSize: 15, width: '100%' }}
          />
        </div>

        <div className="row" style={{ marginBottom: 4 }}>
          <div className="field">
            <label>The night <span className="opt">optional</span></label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field narrow">
            <label>Cur</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {['₹', 'QAR', '$', '€'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field narrow">
            <label>Price</label>
            <input type="number" min="0" step="1" inputMode="decimal" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Anything else on the bill <span className="opt">optional</span></label>
          {extras.map((x, i) => (
            <div className="extra-row" key={i}>
              <input type="text" placeholder="what" value={x.name} onChange={(e) => updateExtra(i, 'name', e.target.value)} />
              <input type="number" placeholder="0" inputMode="decimal" value={x.amt} onChange={(e) => updateExtra(i, 'amt', e.target.value)} />
              <button type="button" onClick={() => removeExtra(i)}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn" style={{ marginTop: 4 }} onClick={addExtra}>
            + line item
          </button>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            cancel
          </button>
          <button className="btn btn-solid" disabled={busy || !label.trim()}>
            {busy ? 'saving…' : 'save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TagModal({ onClose, onSave }) {
  const [tags, setTags] = useState([])
  const [busy, setBusy] = useState(false)
  return (
    <Modal title="Tag someone" subtitle="From your glass mates, or just type a name." onClose={onClose}>
      <TagPicker tags={tags} setTags={setTags} />
      <div className="actions">
        <button className="btn" onClick={onClose}>
          cancel
        </button>
        <button
          className="btn btn-solid"
          disabled={busy || !tags.length}
          onClick={async () => {
            setBusy(true)
            await onSave(tags)
            setBusy(false)
          }}
        >
          add {tags.length || ''}
        </button>
      </div>
    </Modal>
  )
}

function LoadingScreen() {
  return <div style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.14em' }}>loading…</div>
}
function ErrorScreen({ message }) {
  const friendly = /no rows|multiple \(or no\) rows|JSON object requested/i.test(message)
    ? "This bottle isn't on your shelf. You can only open bottles you own or are tagged on."
    : message
  return <div style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', color: '#B4231C', fontSize: 14, padding: 24, textAlign: 'center' }}>{friendly}</div>
}
