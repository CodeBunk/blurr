import { useEffect, useRef, useState } from 'react'
import { Audio2 } from '../lib/audio'

// A deliberately fun, attention-grabbing share button — bouncy on hover,
// pops on every press, and throws a little confetti burst once the link
// has actually gone out. Everything else on this page is calm and
// monochrome; this one's allowed to show off a bit.
export default function ShareButton({ onShare, shared }) {
  const [pressing, setPressing] = useState(false)
  const [bursting, setBursting] = useState(false)
  const wasShared = useRef(shared)

  // Confetti fires off the real signal (shared just turned true), not a
  // fixed timer race against the network — so it always lands, even on a
  // slow connection.
  useEffect(() => {
    if (shared && !wasShared.current) {
      setBursting(true)
      const t = setTimeout(() => setBursting(false), 700)
      wasShared.current = true
      return () => clearTimeout(t)
    }
    wasShared.current = shared
  }, [shared])

  const handleClick = () => {
    Audio2.click()
    setPressing(true)
    setTimeout(() => setPressing(false), 550)
    onShare()
  }

  return (
    <button
      type="button"
      className="share-btn"
      data-shared={shared ? '1' : '0'}
      data-pop={pressing ? '1' : '0'}
      aria-pressed={shared}
      onClick={handleClick}
      onPointerEnter={() => Audio2.hover()}
    >
      <span className="share-btn-icon" aria-hidden="true">
        {shared ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 13 10 18 19 7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="3" x2="10" y2="14" />
            <polygon points="21 3 14.5 21 10 14 3 9.5 21 3" />
          </svg>
        )}
      </span>
      <span>{shared ? 'shared!' : 'share'}</span>
      {bursting && (
        <span className="share-confetti" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const dist = 28
            return (
              <i
                key={i}
                style={{
                  '--i': i,
                  '--dx': `${Math.cos(angle) * dist}px`,
                  '--dy': `${Math.sin(angle) * dist}px`,
                }}
              />
            )
          })}
        </span>
      )}
    </button>
  )
}
