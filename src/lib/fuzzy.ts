// Lightweight fuzzy scoring used by the mock backend to emulate the
// server's `match_score` (0–100) for the `street` search parameter.

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Token-overlap similarity with a substring bonus. Returns 0–100.
 * Good enough to rank mock results the way a fuzzy backend would.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = normalize(query)
  const t = normalize(target)
  if (!q) return 0
  if (t.includes(q)) {
    // Strong signal: exact substring. Scale by how much of the target it covers.
    return Math.round(85 + 15 * Math.min(1, q.length / Math.max(t.length, 1)))
  }
  const qTokens = q.split(" ")
  const tTokens = new Set(t.split(" "))
  let hits = 0
  for (const tok of qTokens) {
    if (tTokens.has(tok)) hits += 1
    else if ([...tTokens].some((x) => x.startsWith(tok) || tok.startsWith(x))) hits += 0.5
  }
  const score = (hits / qTokens.length) * 80
  return Math.round(Math.max(0, Math.min(100, score)))
}
