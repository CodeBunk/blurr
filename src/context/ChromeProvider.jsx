import { createContext, useContext, useState } from 'react'
import { Audio2 } from '../lib/audio'

// Global UI chrome state shared across pages: music/SFX toggles and the
// settings drawer. Kept separate from SessionProvider since it has nothing
// to do with auth.
const ChromeContext = createContext(null)

export function ChromeProvider({ children }) {
  const [musicOn, setMusicOn] = useState(false)
  const [sfxOn, setSfxOn] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleMusic = () => setMusicOn(Audio2.toggleMusic())
  const toggleSfx = () => {
    const next = !sfxOn
    Audio2.setSfx(next)
    setSfxOn(next)
  }

  return (
    <ChromeContext.Provider value={{ musicOn, toggleMusic, sfxOn, toggleSfx, drawerOpen, setDrawerOpen }}>
      {children}
    </ChromeContext.Provider>
  )
}

export function useChrome() {
  const ctx = useContext(ChromeContext)
  if (!ctx) throw new Error('useChrome must be used inside ChromeProvider')
  return ctx
}
