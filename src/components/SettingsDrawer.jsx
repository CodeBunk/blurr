import { useChrome } from '../context/ChromeProvider'

export default function SettingsDrawer() {
  const { drawerOpen, setDrawerOpen, musicOn, toggleMusic, sfxOn, toggleSfx } = useChrome()
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
      </aside>
    </>
  )
}
