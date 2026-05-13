/** Shared state-machine type for /tap-tempo. */
export type TapState =
  | { kind: 'empty' }
  | { kind: 'partial'; bpm: number; intervals: number }
  | { kind: 'stable'; bpm: number; intervals: 6 }
