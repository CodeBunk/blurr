import { Link } from 'react-router-dom'
import { useChrome } from '../context/ChromeProvider'
import SoundToggle from './SoundToggle'
import SettingsDrawer from './SettingsDrawer'
import GlassMatesDrawer from './GlassMatesDrawer'
import { Audio2 } from '../lib/audio'

export default function Navbar({ count, dial, actions }) {
  const { setDrawerOpen, setMateDrawerOpen } = useChrome()

  return (
    <>
      <header className="top">
        <div className="brand" style={{ display: 'flex', alignItems: 'baseline' }}>
          <Link to="/" className="mark grad" onPointerEnter={() => Audio2.hover()}>
            Blurr
          </Link>
          {typeof count === 'number' && count > 0 && (
            <div className="count">
              {count} bottle{count === 1 ? '' : 's'}
            </div>
          )}
        </div>

        {dial && <nav className="on" style={{ display: 'flex', flex: '0 0 auto', order: 3, width: '100%', justifyContent: 'center' }}>{dial}</nav>}

        <div className="tools">
          {actions}
          <SoundToggle />
          <button className="iconbtn" aria-label="settings" onClick={() => setDrawerOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 006 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 002.5 14H2a2 2 0 110-4h.1A1.6 1.6 0 004.6 6l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 4.5V4a2 2 0 114 0v.1A1.6 1.6 0 0018 4.6l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H22a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
            </svg>
          </button>
          <button
            className="btn"
            onClick={() => {
              Audio2.click()
              setMateDrawerOpen(true)
            }}
            onPointerEnter={() => Audio2.hover()}
          >
            glass mates
          </button>
        </div>
      </header>
      <SettingsDrawer />
      <GlassMatesDrawer />
    </>
  )
}
