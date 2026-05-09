/**
 * "Friday evening" — day-of-week + time-of-day, used as the hero
 * eyebrow. Computed from the current local date so it stays correct
 * across timezones without server input.
 */
const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function dayPartLabel(now: Date = new Date()): string {
  const dayName = DAYS[now.getDay()]
  const h = now.getHours()
  let part: string
  if (h < 5) part = 'night'
  else if (h < 12) part = 'morning'
  else if (h < 18) part = 'afternoon'
  else part = 'evening'
  return `${dayName} ${part}`
}
