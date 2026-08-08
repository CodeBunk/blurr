import { useEffect } from 'react'

// Reskinned as the original bottom sheet — .scrim/.sheet, slides up from
// the bottom, same motion as "add a bottle" in the source design.
export default function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const t = requestAnimationFrame(() => document.getElementById('scrim')?.classList.add('on'))
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(t)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div id="scrim" className="scrim on" onClick={(e) => e.target.id === 'scrim' && onClose()}>
      <div className="sheet">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="close" style={{ fontSize: 22, color: 'var(--ink-3)', lineHeight: 1 }}>
            ×
          </button>
        </div>
        {subtitle && <p className="sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
