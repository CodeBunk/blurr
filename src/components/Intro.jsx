import { useEffect, useState } from 'react'

// The bottle-cap "flip in" splash shown once per visit, matching the
// original intro animation timing (capPop ~1.5s, then a fade-out).
export default function Intro() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setGone(true), 1500)
    return () => clearTimeout(t1)
  }, [])

  return (
    <div id="intro" className={gone ? 'gone' : ''} aria-hidden="true">
      <div className="cap" />
      <div className="word">Blurr</div>
    </div>
  )
}
