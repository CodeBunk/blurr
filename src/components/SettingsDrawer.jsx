import { useNavigate } from 'react-router-dom'
import { useChrome } from '../context/ChromeProvider'
import { useSession } from '../context/SessionProvider'

export default function SettingsDrawer() {
  const { drawerOpen, setDrawerOpen, musicOn, toggleMusic, sfxOn, toggleSfx } = useChrome()
  const { profile, signOut } = useSession()
  const navigate = useNavigate()
  return (
    <>
      <div id="drawer-scrim" className={drawerOpen ? 'on' : ''} onClick={() => setDrawerOpen(false)} />
      <aside className={`drawer${drawerOpen ? ' on' : ''}`} aria-label="settings">
        <h4>Settings</h4>
        <button className="close" aria-label="close" onClick={() => setDrawerOpen(false)}>
          ✕
        </button>
        <div className="dgroup">
          <div className="lab">Sound</div>
          <div className="toggle">
            <span>Background music</span>
            <button className="sw" data-on={musicOn ? '1' : '0'} aria-label="music" onClick={toggleMusic} />
          </div>
          <div className="toggle">
            <span>Sound effects</span>
            <button className="sw" data-on={sfxOn ? '1' : '0'} aria-label="sound effects" onClick={toggleSfx} />
          </div>
        </div>

        {profile && (
          <div className="dgroup">
            <div className="lab">Account</div>
            <div className="toggle">
              <span>{profile.display_name}</span>
            </div>
            <button
              className="btn"
              style={{ marginTop: 14, width: '100%' }}
              onClick={() => {
                setDrawerOpen(false)
                signOut().then(() => navigate('/'))
              }}
            >
              sign out
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
