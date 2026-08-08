// Loose name matching used to suggest "is this tag you?" on login/share-claim.
// Deliberately simple — normalize case/whitespace, then exact match, then a
// cheap containment check. Good enough for suggesting, never used to auto-grant.
function normalize(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function namesLikelyMatch(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return false
  if (na === nb) return true
  return na.includes(nb) || nb.includes(na)
}
