// ---- Domain model -------------------------------------------------------

// A single tunable control on a setup. Every value is clamped to [min, max]
// and moves in `step` increments — mirroring the design's promise that you
// can never set a value the sim won't accept.
export interface Setting {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string // e.g. "%", "psi", "Nm", "" (clicks)
  decimals: number // how many decimal places to render
}

export type Weather = 'Dry' | 'Wet'

export interface Setup {
  id: string
  name: string // "Race · 70 min"
  weather: Weather
  trackTempC: number
  fuelL: number | null // null = not applicable (e.g. wet baseline)
  updated: number // epoch ms — drives the "2d ago" label
  settings: Setting[]
}

export interface Car {
  id: string
  name: string
  // setups are keyed by trackId so a car can hold setups for many tracks
  setups: Record<string, Setup[]>
}

export interface Track {
  id: string
  name: string
  cars: Car[]
}

export interface Game {
  id: string
  name: string
  tracks: Track[]
}

// ---- App-wide preferences (the design's configurable props) -------------

export type AccentName = 'Race Red' | 'Signal Blue' | 'Track Green'

export interface Prefs {
  accent: AccentName
  cleanType: boolean // false = Patrick Hand (hand-drawn), true = Work Sans
  showRanges: boolean // show the min/max range bars on every control
}

export const ACCENTS: Record<AccentName, string> = {
  'Race Red': 'oklch(0.62 0.19 25)',
  'Signal Blue': 'oklch(0.62 0.19 250)',
  'Track Green': 'oklch(0.60 0.15 150)',
}
