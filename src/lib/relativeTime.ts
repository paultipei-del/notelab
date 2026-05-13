// Shared relative-time formatters. Two variants for two UI contexts:
// - relTimeShort: compact "5m ago" / "3h ago" / "2d ago" — used by
//   the /flashcards resume tile where horizontal space is tight.
// - relTimeLong: verbose "2 hours ago" / "yesterday" / "3 days ago"
//   — used by /ear-training card status indicators where there's
//   room for full words.

/** Compact form: "Nm ago", "Nh ago", "yesterday", "Nd ago", "last week". */
export function relTimeShort(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 0) return 'soon'
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${Math.max(1, min)}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  return 'last week'
}

/** Verbose form, always lowercase: "just now", "1 hour ago",
 *  "N hours ago", "yesterday", "N days ago". Designed for the
 *  /ear-training cards which cap at 14 days via filtering. */
export function relTimeLong(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 0) return 'just now'
  const min = Math.floor(diff / 60000)
  if (min < 60) return 'just now'
  const hr = Math.floor(min / 60)
  if (hr === 1) return '1 hour ago'
  if (hr < 24) return `${hr} hours ago`
  const d = Math.floor(hr / 24)
  if (d === 1) return 'yesterday'
  return `${d} days ago`
}
