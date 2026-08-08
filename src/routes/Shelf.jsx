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

  const onPointerDown = (e) => {
    if (!canDrag || e.button) return
    drag.current = { id: bottle.id, x0: e.clientX, y0: e.clientY, moved: 0 }
    ref.current.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    d.moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0)
    if (d.moved <= 8) return
    if (!ref.current.classList.contains('lifting')) Audio2.pickup()
    ref.current.classList.add('lifting')
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('.bottle')
    if (!under || under === ref.current) return
    const overId = under.dataset.id
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

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    ref.current?.classList.remove('lifting')
    if (!d) return
    if (d.moved <= 8) {
      onOpen(bottle.id)
    } else {
      Audio2.place()
      onDrop(allBottles)
    }
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
