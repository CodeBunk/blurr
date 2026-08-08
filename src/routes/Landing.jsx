import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SoundToggle from '../components/SoundToggle'
import SettingsDrawer from '../components/SettingsDrawer'
import { useChrome } from '../context/ChromeProvider'

// Public landing page — no login required. Adding a bottle or viewing a
// shelf is what actually requires an account; this page just explains the
// idea and pushes toward signing up. Header matches the same minimal bar
// as the signed-in shelf (sound, settings, add) rather than auth buttons —
// "+ add a bottle" is what actually routes a new visitor to sign up.
export default function Landing() {
  const heroRef = useRef(null)
  const shelfViewRef = useRef(null)
  const navigate = useNavigate()
  const { setDrawerOpen } = useChrome()

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const move = (e) => {
      const r = hero.getBoundingClientRect()
      hero.style.setProperty('--mx', e.clientX - r.left + 'px')
      hero.style.setProperty('--my', e.clientY - r.top + 'px')
    }
    const leave = () => {
      hero.style.setProperty('--mx', '50%')
      hero.style.setProperty('--my', '44%')
    }
    hero.addEventListener('pointermove', move)
    hero.addEventListener('pointerleave', leave)
    return () => {
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <div>
      <header className="top">
        <div className="brand" style={{ display: 'flex', alignItems: 'baseline' }}>
          <div className="mark grad">Blurr</div>
        </div>
        <div className="tools">
          <SoundToggle />
          <button className="iconbtn" aria-label="settings" onClick={() => setDrawerOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 006 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 002.5 14H2a2 2 0 110-4h.1A1.6 1.6 0 004.6 6l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 4.5V4a2 2 0 114 0v.1A1.6 1.6 0 0018 4.6l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H22a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
            </svg>
          </button>
          <button className="btn btn-solid" onClick={() => navigate('/signup')}>
            + add a bottle
          </button>
        </div>
      </header>
      <SettingsDrawer />

      <section className="hero" id="hero" ref={heroRef}>
        <div className="h-inner">
          <span className="badge">Blurr — phygital liquor vault</span>
          <h1 className="grad">
            Preserving those
            <br />
            fuzzy moments.
          </h1>
          <p className="lede">
            A <b>phygital space</b> to store — and hide — those NSFW nights. Pick the bottle, keep the
            receipt, let everyone who drank along file their own version before it all goes blurry.
          </p>
          <div className="cta">
            <button className="cta-big" onClick={() => navigate('/signup')}>
              + Add your first bottle <span style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.7 }}>↵</span>
            </button>
            <button className="cta-ghost" onClick={() => shelfViewRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works
            </button>
          </div>
          <p style={{ marginTop: 18, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '.07em', color: 'var(--ink-3)' }}>
            already on Blurr?{' '}
            <Link to="/login" style={{ color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              sign in
            </Link>
          </p>
        </div>
        <div className="lens" aria-hidden="true" />
        <div className="vig" aria-hidden="true" />
        <div className="ring" aria-hidden="true" />
      </section>

      <section className="explain" ref={shelfViewRef}>
        <div className="kicker">What we store</div>
        <h2>One bottle. Three things worth keeping.</h2>
        <div className="trio">
          <div className="tcard">
            <div className="no">01</div>
            <h3>The setup</h3>
            <p>The bottle, the date, the damage. What you drank, what it cost — printed like a receipt you can't lose.</p>
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M9 2h6M10 2v4l-3 6v8a2 2 0 002 2h6a2 2 0 002-2v-8l-3-6V2" />
            </svg>
          </div>
          <div className="tcard">
            <div className="no">02</div>
            <h3>The scenes</h3>
            <p>Every blurry photo from that night, dropped straight off everyone's phones into one gallery.</p>
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.6" />
              <path d="M21 16l-5-5-9 8" />
            </svg>
          </div>
          <div className="tcard">
            <div className="no">03</div>
            <h3>Notes from everyone</h3>
            <p>Same night, everyone's own account of it. Nobody edits anybody else's — only the person tagged can write theirs.</p>
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M4 5h16M4 10h16M4 15h10" />
              <path d="M15 19l2 2 4-4" />
            </svg>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 26px 100px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 26, marginBottom: 12 }}>Tag someone, they get the bottle too</h2>
        <p style={{ color: 'var(--ink-2)', maxWidth: 520, margin: '0 auto' }}>
          No groups to set up. Tag a friend on a bottle and it shows up on their shelf. Type a name
          they haven't joined yet, and it's waiting for them the moment they sign up and confirm it's them.
        </p>
      </section>
    </div>
  )
}
