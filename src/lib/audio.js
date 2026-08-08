// Ported near-verbatim from the original prototype's Web Audio engine —
// one AudioContext, a tiny generative music loop, plus short SFX blips.
// No DOM dependencies; components just call Audio2.hover()/click()/etc.
let ctx, master, mgain, timer, step = 0
let music = false
let sfxOn = true
let startAt = 0

const ensure = () => {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)
    mgain = ctx.createGain()
    mgain.gain.value = 0
    mgain.connect(master)
  }
  ctx.resume()
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => ctx && ctx.resume(), { passive: true })
}

const F = (n) => 110 * Math.pow(2, n / 12)
const CLAVE = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0]
const BASS = [0, null, 7, null, 5, null, 3, null, 0, null, 7, null, 10, null, 8, null]
const SPB = 60 / 106 / 2

const pluck = (t, f, g) => {
  const o = ctx.createOscillator(), v = ctx.createGain(), lp = ctx.createBiquadFilter()
  o.type = 'triangle'
  o.frequency.value = f
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(2600, t)
  lp.frequency.exponentialRampToValueAtTime(700, t + 0.28)
  v.gain.setValueAtTime(0, t)
  v.gain.linearRampToValueAtTime(g, t + 0.008)
  v.gain.exponentialRampToValueAtTime(0.0001, t + 0.34)
  o.connect(lp).connect(v).connect(mgain)
  o.start(t)
  o.stop(t + 0.36)
}
const bassN = (t, f) => {
  const o = ctx.createOscillator(), v = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(f, t)
  v.gain.setValueAtTime(0, t)
  v.gain.linearRampToValueAtTime(0.16, t + 0.02)
  v.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
  o.connect(v).connect(mgain)
  o.start(t)
  o.stop(t + 0.44)
}
const shaker = (t, g) => {
  const len = ctx.sampleRate * 0.05
  const b = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), v = ctx.createGain()
  s.buffer = b
  hp.type = 'highpass'
  hp.frequency.value = 6200
  v.gain.value = g
  s.connect(hp).connect(v).connect(mgain)
  s.start(t)
}
const tick = () => {
  const now = ctx.currentTime
  while (step * SPB < now - startAt + 0.2) {
    const t = startAt + step * SPB, i = step % 16
    if (CLAVE[i]) pluck(t, F([0, 7, 12, 15, 19][(step / 1) % 5 | 0] + 12), 0.09)
    if (BASS[i] != null) bassN(t, F(BASS[i] - 12))
    shaker(t, i % 2 ? 0.012 : 0.022)
    if (i === 14) pluck(t, F(34), 0.05)
    step++
  }
}

const beep = (f, dur, type, g) => {
  if (!sfxOn || !ctx) return
  const o = ctx.createOscillator(), v = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, ctx.currentTime)
  v.gain.setValueAtTime(0, ctx.currentTime)
  v.gain.linearRampToValueAtTime(g, ctx.currentTime + 0.004)
  v.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
  o.connect(v).connect(master)
  o.start()
  o.stop(ctx.currentTime + dur + 0.02)
}
const beepAt = (t, f, dur, type, g) => {
  const o = ctx.createOscillator(), v = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  v.gain.setValueAtTime(0, t)
  v.gain.linearRampToValueAtTime(g, t + 0.01)
  v.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(v).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export const Audio2 = {
  toggleMusic() {
    ensure()
    music = !music
    mgain.gain.cancelScheduledValues(ctx.currentTime)
    mgain.gain.linearRampToValueAtTime(music ? 0.16 : 0, ctx.currentTime + (music ? 0.9 : 0.45))
    if (music) {
      startAt = ctx.currentTime + 0.06
      step = 0
      tick()
      timer = setInterval(tick, 120)
    } else clearInterval(timer)
    return music
  },
  get musicOn() {
    return music
  },
  setSfx(v) {
    sfxOn = v
  },
  get sfxOn() {
    return sfxOn
  },
  hover() {
    ensure()
    beep(760 + Math.random() * 60, 0.055, 'square', 0.05)
  },
  click() {
    ensure()
    beep(620, 0.05, 'square', 0.07)
    setTimeout(() => beep(940, 0.1, 'square', 0.07), 52)
  },
  fanfare() {
    ensure()
    if (!sfxOn) return
    const t = ctx.currentTime + 0.03
    ;[0, 4, 7, 12, 16, 19, 24].forEach((n, i) => beepAt(t + i * 0.085, F(n + 12), 0.17, 'square', 0.06))
    beepAt(t + 0.6, F(31), 0.3, 'triangle', 0.05)
  },
  chime() {
    ensure()
    if (!sfxOn) return
    const t = ctx.currentTime + 0.04
    beepAt(t, F(24), 0.5, 'sine', 0.05)
    beepAt(t + 0.13, F(31), 0.55, 'sine', 0.045)
    beepAt(t + 0.26, F(36), 0.6, 'sine', 0.035)
  },
  trash() {
    ensure()
    if (!sfxOn) return
    const t = ctx.currentTime
    beepAt(t, 190, 0.14, 'sawtooth', 0.06)
    beepAt(t + 0.05, 120, 0.2, 'sawtooth', 0.05)
    beepAt(t + 0.02, 80, 0.3, 'sine', 0.05)
  },
  tickSfx() {
    ensure()
    if (!sfxOn) return
    const t = ctx.currentTime
    beepAt(t, 2100, 0.018, 'square', 0.045)
    beepAt(t + 0.03, 1500, 0.03, 'square', 0.03)
  },
  // A short filtered-noise sweep — glass bottle rolling along wood.
  roll() {
    ensure()
    if (!sfxOn) return
    const t = ctx.currentTime
    const len = ctx.sampleRate * 0.4
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.8
    const s = ctx.createBufferSource()
    const bp = ctx.createBiquadFilter()
    const v = ctx.createGain()
    s.buffer = buf
    bp.type = 'bandpass'
    bp.Q.value = 2.2
    bp.frequency.setValueAtTime(280, t)
    bp.frequency.linearRampToValueAtTime(900, t + 0.4)
    v.gain.value = 0.14
    s.connect(bp).connect(v).connect(master)
    s.start(t)
  },
  // Glass clink — a bottle lifted off the shelf.
  pickup() {
    ensure()
    if (!sfxOn) return
    const t = ctx.currentTime
    beepAt(t, 1450, 0.05, 'sine', 0.05)
    beepAt(t + 0.03, 1800, 0.06, 'sine', 0.035)
  },
  // Glass clink, lower and rounder — a bottle set back down.
  place() {
    ensure()
    if (!sfxOn) return
    const t = ctx.currentTime
    beepAt(t, 520, 0.09, 'sine', 0.06)
    beepAt(t + 0.02, 780, 0.07, 'triangle', 0.045)
    beepAt(t + 0.05, 1300, 0.05, 'sine', 0.03)
  },
}
