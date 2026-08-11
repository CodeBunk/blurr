import { useEffect, useRef, useState } from 'react'
import { Audio2 } from '../lib/audio'

export const SHELVES = { board: 'Board', wooden: 'Wooden', floating: 'Floating', crate: 'Crate', fridge: 'Fridge' }
const KEYS = Object.keys(SHELVES)
const N = KEYS.length
const DIAL_R = 347 // px — radius of the (mostly offscreen) bezel circle, matched to the larger .dial in CSS
const DIAL_STEP = 15 // degrees between neighbouring options, from the original design
const PX_PER_STEP = DIAL_R * (DIAL_STEP * (Math.PI / 180)) // arc length per step, for drag feel

// The original design-bible dial: a semicircular bezel just off the top of
// the header, with names and tick marks printed along its rim like a
// measuring scale, faded at both ends by a mask so it reads as a strip of
// a much bigger wheel rather than a flat row. Reuses the exact `.dial`
// `.arc` `.tick` `.pin` `.spoke` classes ported from the original CSS.
//
// One thing the original didn't have: real dragging (it only stepped one
// notch per click or wheel-tick). This version turns the whole scale
// fluidly under your finger and snaps to the nearest name on release —
// same look, better feel.
export default function ShelfDial({ value, onChange }) {
  const cur = KEYS.indexOf(value)
  const [pos, setPos] = useState(cur) // continuous position, 0..N-1
  const [dragging, setDragging] = useState(false)
  const [curIdx, setCurIdx] = useState(cur)
  const wrapRef = useRef(null)
  const drag = useRef(null)
  const lastStep = useRef(cur)

  // Reflect external changes to `value`, but never fight a drag in progress.
  useEffect(() => {
    if (dragging) return
    setPos(cur)
    setCurIdx(cur)
    lastStep.current = cur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (idx) => {
    idx = Math.max(0, Math.min(N - 1, idx))
    if (idx !== lastStep.current) {
      lastStep.current = idx
      setCurIdx(idx)
      Audio2.tickSfx()
      onChange(KEYS[idx])
    }
  }

  const onPointerDown = (e) => {
    drag.current = { x0: e.clientX, moved: 0, startPos: pos, onSpoke: !!e.target.closest('.spoke') }
    wrapRef.current.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x0
    d.moved = Math.max(d.moved, Math.abs(dx))
    if (d.moved <= 6) return
    if (!dragging) setDragging(true)
    // dragging right brings later options in
    const next = Math.max(0, Math.min(N - 1, d.startPos + dx / PX_PER_STEP))
    setPos(next)
    commit(Math.round(next))
  }

  const endDrag = (e) => {
    const d = drag.current
    drag.current = null
    try {
      wrapRef.current.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    if (!d) return
    if (d.moved <= 6) {
      // a plain tap on the bezel itself (not a spoke) steps forward one, as in the original
      if (!d.onSpoke) commit(lastStep.current + 1)
    } else {
      setDragging(false)
      setPos(lastStep.current)
    }
  }

  const jumpTo = (i) => {
    commit(i)
    setPos(i)
  }

  const onWheel = (e) => {
    e.preventDefault()
    if (Math.abs(e.deltaY) > 4) commit(lastStep.current + (e.deltaY > 0 ? 1 : -1))
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      jumpTo(Math.min(N - 1, lastStep.current + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      jumpTo(Math.max(0, lastStep.current - 1))
    }
  }

  return (
    <div
      ref={wrapRef}
      className="dial"
      role="slider"
      tabIndex={0}
      aria-label="shelf style"
      aria-valuemin={0}
      aria-valuemax={N - 1}
      aria-valuenow={curIdx}
      aria-valuetext={SHELVES[value]}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ cursor: dragging ? 'grabbing' : 'pointer', touchAction: 'none' }}
    >
      <div className="arc" />
      {KEYS.map((_, i) => (
        <i
          key={i}
          className="tick"
          style={{
            transform: `translateX(-50%) rotate(${(i - pos) * DIAL_STEP}deg)`,
            transformOrigin: `50% ${DIAL_R}px`,
            transition: dragging ? 'none' : undefined,
          }}
        />
      ))}
      <span className="pin" />
      {KEYS.map((k, i) => {
        const off = (i - pos) * DIAL_STEP
        const d = Math.abs(i - pos)
        return (
          <button
            key={k}
            type="button"
            className={`spoke${i === curIdx ? ' cur' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              jumpTo(i)
            }}
            onPointerEnter={() => Audio2.hover()}
            style={{
              transform: `translateX(-50%) rotate(${off}deg)`,
              transformOrigin: `50% ${DIAL_R}px`,
              opacity: Math.max(0.15, 1 - d * 0.28),
              transition: dragging ? 'opacity .15s linear, color .3s var(--smooth)' : undefined,
            }}
          >
            <span className="n">0{i + 1}</span>
            {SHELVES[k]}
          </button>
        )
      })}
    </div>
  )
}
