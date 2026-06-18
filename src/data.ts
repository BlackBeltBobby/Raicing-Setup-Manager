import type { Game, Setting, Setup } from './types'

const DAY = 24 * 60 * 60 * 1000

let seq = 0
const uid = (p: string) => `${p}_${(seq++).toString(36)}`

// A full GT3-style settings sheet (14 controls). Each entry is [label, value,
// min, max, step, unit, decimals]. Ranges are the "real allowed range" the
// design clamps every control to.
type Spec = [string, number, number, number, number, string, number]
const GT3_SHEET: Spec[] = [
  ['Brake bias', 54.5, 50.0, 58.0, 0.2, '%', 1],
  ['Rear wing', 7, 1, 11, 1, '', 0],
  ['Front tyre psi', 26.1, 25.0, 30.0, 0.1, 'psi', 1],
  ['Rear tyre psi', 26.4, 25.0, 30.0, 0.1, 'psi', 1],
  ['Diff preload', 70, 20, 300, 10, 'Nm', 0],
  ['Front anti-roll bar', 3, 1, 8, 1, '', 0],
  ['Rear anti-roll bar', 5, 1, 8, 1, '', 0],
  ['Front ride height', 54, 50, 75, 1, 'mm', 0],
  ['Rear ride height', 68, 60, 95, 1, 'mm', 0],
  ['Front camber', -3.4, -4.0, -2.0, 0.1, '°', 1],
  ['Rear camber', -2.9, -3.5, -1.5, 0.1, '°', 1],
  ['Front toe', 0.02, -0.2, 0.2, 0.01, '°', 2],
  ['Rear toe', 0.12, 0.0, 0.4, 0.01, '°', 2],
  ['Brake duct', 3, 0, 6, 1, '', 0],
]

function sheet(overrides: Partial<Record<string, number>> = {}): Setting[] {
  return GT3_SHEET.map(([label, value, min, max, step, unit, decimals]) => ({
    id: uid('set'),
    label,
    value: overrides[label] ?? value,
    min,
    max,
    step,
    unit,
    decimals,
  }))
}

function setup(
  name: string,
  weather: Setup['weather'],
  trackTempC: number,
  fuelL: number | null,
  ageDays: number,
  overrides?: Partial<Record<string, number>>,
): Setup {
  return {
    id: uid('setup'),
    name,
    weather,
    trackTempC,
    fuelL,
    updated: Date.now() - ageDays * DAY,
    settings: sheet(overrides),
  }
}

// ---- The garage ---------------------------------------------------------
// Mirrors the wireframes: ACC → Spa → Ferrari 296 GT3 holds the three setups
// shown in the design. Other games/tracks/cars are present and navigable so
// the whole flow is clickable.

export function seedGames(): Game[] {
  return [
    {
      id: 'acc',
      name: 'Assetto Corsa Comp.',
      tracks: [
        {
          id: 'spa',
          name: 'Spa-Francorchamps',
          cars: [
            {
              id: 'ferrari296',
              name: 'Ferrari 296 GT3',
              setups: {
                spa: [
                  setup('Race · 70 min', 'Dry', 28, 96, 2, { 'Rear wing': 7 }),
                  setup('Quali · low fuel', 'Dry', 26, 22, 2, {
                    'Rear wing': 5,
                    'Brake bias': 55.0,
                  }),
                  setup('Wet baseline', 'Wet', 18, null, 7, {
                    'Rear wing': 10,
                    'Front tyre psi': 27.5,
                    'Rear tyre psi': 27.5,
                  }),
                ],
              },
            },
            {
              id: 'porsche992',
              name: 'Porsche 992 GT3 R',
              setups: {
                spa: [
                  setup('Race · 70 min', 'Dry', 27, 94, 3),
                  setup('Quali', 'Dry', 25, 24, 3, { 'Rear wing': 4 }),
                ],
              },
            },
            {
              id: 'bmwm4',
              name: 'BMW M4 GT3',
              setups: {
                spa: [setup('Race baseline', 'Dry', 29, 90, 5)],
              },
            },
            {
              id: 'mclaren720',
              name: 'McLaren 720S GT3',
              setups: {},
            },
          ],
        },
        { id: 'monza', name: 'Monza', cars: monzaCars() },
        { id: 'nurburgring', name: 'Nürburgring GP', cars: [] },
        { id: 'suzuka', name: 'Suzuka', cars: [] },
        { id: 'panorama', name: 'Mount Panorama', cars: [] },
      ],
    },
    { id: 'iracing', name: 'iRacing', tracks: [] },
    { id: 'f124', name: 'F1 24', tracks: [] },
    { id: 'lmu', name: 'Le Mans Ultimate', tracks: [] },
  ]
}

function monzaCars(): Game['tracks'][number]['cars'] {
  return [
    {
      id: 'ferrari296',
      name: 'Ferrari 296 GT3',
      setups: {
        monza: [
          setup('Race · low downforce', 'Dry', 31, 98, 4, { 'Rear wing': 2 }),
        ],
      },
    },
    { id: 'porsche992', name: 'Porsche 992 GT3 R', setups: {} },
  ]
}

// A blank settings sheet for brand-new setups.
export function blankSheet(): Setting[] {
  return sheet()
}

export { uid }
