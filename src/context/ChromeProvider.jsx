import { createContext, useContext, useState } from 'react'
import { Audio2 } from '../lib/audio'

// Global UI chrome state shared across pages: music/SFX toggles and the
// settings drawer. Kept separate from SessionProvider since it has nothing
// to do with auth.
const ChromeContext = createContext(null)

export function ChromeProvider({ children }) {
  const [musicOn, setMusicOn] = useState(false)
  const [sfxOn, setSfxOn] = useState(true)
  const [drawerOpen, setDrawerOpen_] = useState(false)
  const [mateDrawerOpen, setMateDrawerOpen_] = useState(false)

  const toggleMusic = () => setMusicOn(Audio2.toggleMusic())
  const toggleSfx = () => {
    const next = !sfxOn
    Audio2.setSfx(next)
    setSfxOn(next)
  }

  // Only one side drawer open at a time — opening one closes the other.
  const setDrawerOpen = (v) => {
    setDrawerOpen_(v)
    if (v) setMateDrawerOpen_(false)
  }
  const setMateDrawerOpen = (v) => {
    setMateDrawerOpen_(v)
    if (v) setDrawerOpen_(false)
  }

  return (
    <ChromeContext.Provider
      value={{ musicOn, toggleMusic, sfxOn, toggleSfx, drawerOpen, setDrawerOpen, mateDrawerOpen, setMateDrawerOpen }}
    >
      {children}
    </ChromeContext.Provider>
  )
}

export function useChrome() {
  const ctx = useContext(ChromeContext)
  if (!ctx) throw new Error('useChrome must be used inside ChromeProvider')
  return ctx
}
