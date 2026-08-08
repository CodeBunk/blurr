import { useEffect, useRef, useState } from 'react'
import { Audio2 } from '../lib/audio'

export const SHELVES = { board: 'Board', wooden: 'Wooden', floating: 'Floating', crate: 'Crate', fridge: 'Fridge' }
const KEYS = Object.keys(SHELVES)
const N = KEYS.length

// A dark glossy capsule dial, like a scale on a piece of hi-fi gear — a
// row of ticks in a pill-shaped groove, with the current position lit up
// bright white. Drag anywhere on the track and the lit mark follows your
// finger, snapping tick to tick.
export default function ShelfDial({ value, onChange }) {
  const cur = KEYS.indexOf(value)
  const [activeIdx, setActiveIdx] = useState(cur)
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef(null)
  const dragging_ = useRef(false)

  useEffect(() => {
    if (!dragging) setActiveIdx(KEYS.indexOf(value))
  }, [value, dragging])

  const idxFromX = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect()
    const pad = rect.height / 2
    const usable = Math.max(rect.width - pad * 2, 1)
    const x = Math.min(Math.max(clientX - rect.left - pad, 0), usable)
    return Math.round((x / usable) * (N - 1))
  }

  const settle = (idx) => {
    setActiveIdx((prev) => {
      if (idx !== prev) {
        Audio2.roll()
        onChange(KEYS[idx])
      }
      return idx
    })
  }

  const onPointerDown = (e) => {
    dragging_.current = true
    setDragging(true)
    trackRef.current.setPointerCapture(e.pointerId)
    settle(idxFromX(e.clientX))
  }
  const onPointerMove = (e) => {
    if (!dragging_.current) return
    settle(idxFromX(e.clientX))
  }
  const endDrag = (e) => {
    dragging_.current = false
    setDragging(false)
    try {
      trackRef.current.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }

  const jumpTo = (i) => {
    settle(Math.max(0, Math.min(N - 1, i)))
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      jumpTo(activeIdx + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      jumpTo(activeIdx - 1)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="shelf style"
        aria-valuemin={0}
        aria-valuemax={N - 1}
        aria-valuenow={activeIdx}
        aria-valuetext={SHELVES[value]}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          position: 'relative',
          width: 236,
          height: 42,
          borderRadius: 999,
          background: 'linear-gradient(180deg,#323235,#0a0a0b 62%,#000)',
          boxShadow:
            'inset 0 3px 7px rgba(0,0,0,.7), inset 0 -1px 0 rgba(255,255,255,.06), inset 0 0 0 1px rgba(255,255,255,.05), 0 14px 30px rgba(0,0,0,.34), 0 2px 0 rgba(255,255,255,.5)',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* glossy top highlight, like light catching a rounded metal groove */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 10,
            right: 10,
            height: '38%',
            borderRadius: 999,
            background: 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,0))',
            pointerEvents: 'none',
          }}
        />

        {KEYS.map((k, i) => {
          const left = N > 1 ? (i / (N - 1)) * 100 : 50
          const active = i === activeIdx
          return (
            <div
              key={k}
              onPointerEnter={() => Audio2.hover()}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${left}%`,
                transform: 'translate(-50%,-50%)',
                width: active ? 3 : 2,
                height: active ? 22 : 14,
                borderRadius: 2,
                background: active ? '#fff' : 'rgba(255,255,255,.28)',
                boxShadow: active ? '0 0 12px rgba(255,255,255,.9), 0 0 3px #fff' : 'none',
                transition: dragging ? 'none' : 'all .28s var(--smooth)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>

      {/* names for every stop, not just the active one — the active name
          lifts, darkens and gets heavier so it still reads as "selected" */}
      <div style={{ display: 'flex', width: 236, justifyContent: 'space-between' }}>
        {KEYS.map((k, i) => {
          const active = i === activeIdx
          return (
            <button
              key={k}
              type="button"
              onClick={() => jumpTo(i)}
              onPointerEnter={() => Audio2.hover()}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 9.5,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                fontWeight: active ? 700 : 400,
                transform: active ? 'translateY(-1px)' : 'none',
                transition: 'color .3s var(--smooth), transform .3s var(--smooth)',
                whiteSpace: 'nowrap',
                padding: '2px 1px',
              }}
            >
              {SHELVES[k]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
