import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AddBottleModal from '../components/AddBottleModal'
import ClaimPrompt from '../components/ClaimPrompt'
import BottleGlyph from '../components/BottleGlyph'
import Circus from '../components/Circus'
import ShelfDial from '../components/ShelfDial'
import { useSession } from '../context/SessionProvider'
import { listMyShelf, createBottle, reorderBottles } from '../lib/bottles'
import { Audio2 } from '../lib/audio'

const PER_RACK = 6

export default function Shelf() {
  const { profile } = useSession()
  const navigate = useNavigate()
  const [bottles, setBottles] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [shelfStyle, setShelfStyle] = useState('floating')
  const [circusOn, setCircusOn] = useState(false)
  const pendingSave = useRef(null)

  const load = () => listMyShelf().then(setBottles).catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  const save = async (payload) => {
    pendingSave.current = payload
    setAdding(false)
    setCircusOn(true)
  }

  const racks = []
  if (bottles?.length) {
    for (let i = 0; i < bottles.length; i += PER_RACK) racks.push(bottles.slice(i, i + PER_RACK))
  }

  return (
    <div>
      <Navbar count={bottles?.length} dial={<ShelfDial value={shelfStyle} onChange={setShelfStyle} />} />
      <ClaimPrompt />

      <main id="shelf-view">
        <div className="shead">
          <h2 className="grad">The shelf</h2>
          <button className="btn btn-solid" onClick={() => setAdding(true)}>
            + add a bottle
          </button>
        </div>

        {error && <p style={{ textAlign: 'center', color: '#B4231C', fontSize: 13.5 }}>{error}</p>}

        <div className="unit" data-shelf={shelfStyle}>
          {bottles === null ? (
            <p className="hint">loading…</p>
          ) : bottles.length === 0 ? (
            <div className="empty">
              <p>Shelf's empty. Somebody go out.</p>
              <button className="btn btn-solid" onClick={() => setAdding(true)}>
                + add the first bottle
              </button>
            </div>
          ) : bottles.length === 1 ? (
            <FeaturedBottle bottle={bottles[0]} onOpen={() => navigate(`/b/${bottles[0].id}`)} />
          ) : (
            racks.map((row, ri) => (
              <Rack
                key={ri}
                row={row}
                allBottles={bottles}
                setBottles={setBottles}
                onDrop={(next) => reorderBottles(next, profile.id).catch(() => {})}
                onOpen={(id) => navigate(`/b/${id}`)}
              />
            ))
          )}
        </div>

        {bottles?.length > 0 && <p className="hint">tap a bottle to open it · drag to rearrange yours</p>}
      </main>

      {adding && <AddBottleModal onClose={() => setAdding(false)} onSave={save} />}

      {circusOn && (
        <Circus
          onMidpoint={async () => {
            const payload = pendingSave.current
            if (payload) await createBottle(payload, payload.tags, profile.id)
          }}
          onDone={() => {
            setCircusOn(false)
            load()
          }}
        />
      )}
    </div>
  )
}

// With only one bottle on the shelf, a whole rack row of empty space looks
// broken — show it big and centered instead, like a single record on
// display rather than a grid tile.
function FeaturedBottle({ bottle, onOpen }) {
  return (
    <div
      className="bottle"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onPointerEnter={() => Audio2.hover()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '48px 24px',
        cursor: 'pointer',
        maxWidth: 360,
        margin: '0 auto',
      }}
    >
      <div className="vis">
        <BottleGlyph skin={bottle.skin} photoUrl={bottle.photo_url} size={220} />
      </div>
      <div className="nm" style={{ fontSize: 20 }}>
        {bottle.label}
      </div>
    </div>
  )
}

function Rack({ row, allBottles, setBottles, onDrop, onOpen }) {
  return (
    <div className="rack">
      <div className="shelfline">
        {row.map((b, i) => (
          <BottleItem key={b.id} bottle={b} index={i} allBottles={allBottles} setBottles={setBottles} onDrop={onDrop} onOpen={onOpen} />
        ))}
      </div>
      <div className="support">
        <div className="a" />
        <div className="b" />
      </div>
    </div>
  )
}

function BottleItem({ bottle, index, allBottles, setBottles, onDrop, onOpen }) {
  const { profile } = useSession()
  const canDrag = profile && bottle.owner_id === profile.id
  const ref = useRef(null)
  const drag = useRef(null)

  // Every bottle is tap-to-open, whether you own it or were just tagged on
  // it — only actually dragging-to-reorder is restricted to the owner. The
  // pointer tracker has to start on every bottle regardless, or there's
  // nothing for onPointerUp to open with on a plain tap.
  const onPointerDown = (e) => {
    if (e.button) return
    drag.current = { id: bottle.id, x0: e.clientX, y0: e.clientY, moved: 0 }
    ref.current.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d || !canDrag) return
    // If the button/touch was released without us ever getting a
    // pointerup (lost focus, released outside the window, browser
    // cancelled the gesture, etc.), the drag never officially ended —
    // and every later mouse movement, even plain hovering, would keep
    // reordering things as if still dragging. Bail out the moment we
    // notice nothing is actually being held down anymore.
    if (e.buttons === 0) {
      drag.current = null
      ref.current?.classList.remove('lifting')
      return
    }
    d.moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0)
    if (d.moved <= 8) return
    if (!ref.current.classList.contains('lifting')) Audio2.pickup()
    ref.current.classList.add('lifting')

    // Find whichever bottle in this row sits closest to the pointer, by
    // actual position rather than document.elementFromPoint — that fails
    // whenever the pointer is over a gap, or past the last item in the
    // row (nothing to hit-test there), which is exactly why the rightmost
    // slot could never be reordered before.
    const row = ref.current.closest('.shelfline')
    if (!row) return
    let closest = null
    let closestDist = Infinity
    for (const el of row.querySelectorAll('.bottle')) {
      if (el === ref.current) continue
      const r = el.getBoundingClientRect()
      const dist = Math.abs(e.clientX - (r.left + r.width / 2))
      if (dist < closestDist) {
        closestDist = dist
        closest = el
      }
    }
    if (!closest) return
    const overId = closest.dataset.id
    if (overId === d.lastOverId) return
    const fromIdx = allBottles.findIndex((x) => x.id === d.id)
    const toIdx = allBottles.findIndex((x) => x.id === overId)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return
    d.lastOverId = overId
    Audio2.shift(Math.abs(toIdx - fromIdx))
    setBottles((cur) => {
      const from = cur.findIndex((x) => x.id === d.id)
      const to = cur.findIndex((x) => x.id === overId)
      if (from < 0 || to < 0 || from === to) return cur
      const next = cur.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const endDrag = (e) => {
    try {
      ref.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    const d = drag.current
    drag.current = null
    ref.current?.classList.remove('lifting')
    return d
  }

  const onPointerUp = (e) => {
    const d = endDrag(e)
    if (!d) return
    if (!canDrag || d.moved <= 8) {
      onOpen(bottle.id)
    } else {
      Audio2.place()
      onDrop(allBottles)
    }
  }

  const onPointerCancel = (e) => {
    endDrag(e)
  }

  return (
    <div
      ref={ref}
      className="bottle"
      data-id={bottle.id}
      role="button"
      tabIndex={0}
      style={{ animationDelay: `${index * 36}ms`, cursor: canDrag ? 'grab' : 'pointer' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerEnter={() => Audio2.hover()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen(bottle.id)}
    >
      <div className="vis">
        <BottleGlyph skin={bottle.skin} photoUrl={bottle.photo_url} size={120} />
      </div>
      <div className="nm">{bottle.label}</div>
    </div>
  )
}
