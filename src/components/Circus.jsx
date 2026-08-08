import { useEffect, useState } from 'react'
import { Audio2 } from '../lib/audio'

// The iris "pop" transition from the design bible, shown when a bottle
// lands on the shelf. Opens over a comic burst, calls onMidpoint once
// fully open (so the caller can swap in new data while it's hidden behind
// the burst), holds, then closes back down.
export default function Circus({ onMidpoint, onDone }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    Audio2.chime()
    const raf = requestAnimationFrame(() => setOpen(true))
    const t1 = setTimeout(() => onMidpoint?.(), 520)
    const t2 = setTimeout(() => setOpen(false), 1520)
    const t3 = setTimeout(() => onDone?.(), 2040)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      id="circus"
      className="on"
      style={{ clipPath: open ? 'circle(78% at 50% 50%)' : 'circle(0% at 50% 50%)', transition: 'clip-path .52s cubic-bezier(.22,1,.36,1)' }}
    >
      <div className="burst">
        <div className="sweep" />
        <div className="halo" />
        <div className="halo b" />
        <div className="halo c" />
        <div
          className="msg"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'none' : 'translateY(14px) scale(.97)',
            transition: 'opacity .4s ease .1s, transform .4s cubic-bezier(.22,1,.36,1) .1s',
          }}
        >
          <div className="big">Stay hydrated, champ.</div>
          <div className="sub">one for the vault</div>
        </div>
      </div>
    </div>
  )
}
