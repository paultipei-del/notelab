export type MasteryLevel = 'unseen' | 'weak' | 'developing' | 'strong'

// Per-note result stored inside each session record
export interface NoteResult {
  attempts: number
  correct: number
  responseMsTotal?: number   // sum of response times (play sessions)
}

// Aggregated stats across all sessions for a single note
export interface NoteStats {
  noteId: string             // full pitch string: 'C4', 'F#4', 'Bb3', etc.
  attempts: number
  correct: number
  accuracy: number           // 0–1
  avgResponseMs: number      // 0 for identify sessions
  masteryLevel: MasteryLevel
}

// Mastery thresholds:
//   unseen     = 0 attempts
//   weak       = accuracy < 0.70
//   developing = accuracy 0.70–0.89
//   strong     = accuracy >= 0.90
