// navigator.clipboard.writeText can silently reject — insecure context, no
// permission, or (commonly) because it ran after an `await` and the
// browser no longer considers it "within a user gesture." Falls back to
// the old execCommand('copy') trick, which is more forgiving about that.
// Returns true only if a copy genuinely happened.
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path below */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.top = '-1000px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
