export function cleanUsername(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

export function usernameError(username) {
  if (username.length < 3) return 'At least 3 characters.'
  if (username.length > 20) return 'Keep it under 20 characters.'
  if (!/^[a-z][a-z0-9_]*$/.test(username)) return 'Start with a letter — letters, numbers, _ only.'
  return ''
}

// Stricter than "just 6 characters": needs a mix, not just length.
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[a-z]/.test(p), label: 'A lowercase letter' },
  { test: (p) => /[A-Z]/.test(p), label: 'An uppercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'A number' },
]

export function passwordChecks(password) {
  return PASSWORD_RULES.map((r) => ({ label: r.label, ok: r.test(password) }))
}

export function passwordIsStrong(password) {
  return PASSWORD_RULES.every((r) => r.test(password))
}
