import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { StoreProvider, useStore } from './store'

const wrapper = ({ children }: { children: ReactNode }) => (
  <StoreProvider>{children}</StoreProvider>
)

// The fully-populated path from the seed garage.
const ACC = 'acc'
const SPA = 'spa'
const FERRARI = 'ferrari296'

function setupsFor(store: ReturnType<typeof useStore>) {
  const car = store.games
    .find((g) => g.id === ACC)
    ?.tracks.find((t) => t.id === SPA)
    ?.cars.find((c) => c.id === FERRARI)
  return car?.setups[SPA] ?? []
}

beforeEach(() => {
  localStorage.clear()
})

describe('store mutations', () => {
  it('seeds the Ferrari at Spa with three setups', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    expect(setupsFor(result.current)).toHaveLength(3)
  })

  it('addSetup prepends a new setup and returns its id', () => {
    const { result } = renderHook(() => useStore(), { wrapper })

    let id = ''
    act(() => {
      id = result.current.addSetup(ACC, SPA, FERRARI, 'Test setup')
    })

    const setups = setupsFor(result.current)
    expect(setups).toHaveLength(4)
    expect(setups[0].id).toBe(id)
    expect(setups[0].name).toBe('Test setup')
    expect(setups[0].settings).toHaveLength(14)
  })

  it('addSetup falls back to a default name when blank', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    act(() => {
      result.current.addSetup(ACC, SPA, FERRARI, '   ')
    })
    expect(setupsFor(result.current)[0].name).toBe('Untitled setup')
  })

  it('updateSetting clamps the value and bumps updated', async () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    const setup = setupsFor(result.current)[0]
    const brakeBias = setup.settings.find((s) => s.label === 'Brake bias')!
    const before = setup.updated

    // wait a tick so the new `updated` timestamp is strictly greater
    await new Promise((r) => setTimeout(r, 2))
    act(() => {
      result.current.updateSetting(
        ACC,
        SPA,
        FERRARI,
        setup.id,
        brakeBias.id,
        55.0,
      )
    })

    const after = setupsFor(result.current)[0]
    expect(after.settings.find((s) => s.label === 'Brake bias')!.value).toBe(55)
    expect(after.updated).toBeGreaterThan(before)
  })

  it('updateSetup patches conditions/name and bumps updated', async () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    const setup = setupsFor(result.current)[0]
    const before = setup.updated

    await new Promise((r) => setTimeout(r, 2))
    act(() => {
      result.current.updateSetup(ACC, SPA, FERRARI, setup.id, {
        name: 'Renamed',
        weather: 'Wet',
        trackTempC: 18,
        fuelL: 40,
      })
    })

    const after = setupsFor(result.current)[0]
    expect(after.name).toBe('Renamed')
    expect(after.weather).toBe('Wet')
    expect(after.trackTempC).toBe(18)
    expect(after.fuelL).toBe(40)
    expect(after.updated).toBeGreaterThan(before)
    // a partial patch leaves untouched fields alone
    expect(after.settings).toHaveLength(14)
  })

  it('deleteSetup removes only the targeted setup', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    const victim = setupsFor(result.current)[1]

    act(() => {
      result.current.deleteSetup(ACC, SPA, FERRARI, victim.id)
    })

    const setups = setupsFor(result.current)
    expect(setups).toHaveLength(2)
    expect(setups.some((s) => s.id === victim.id)).toBe(false)
  })

  it('resetAll restores the seed data', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    act(() => {
      result.current.deleteSetup(ACC, SPA, FERRARI, setupsFor(result.current)[0].id)
    })
    expect(setupsFor(result.current)).toHaveLength(2)

    act(() => {
      result.current.resetAll()
    })
    expect(setupsFor(result.current)).toHaveLength(3)
  })

  it('persists games to localStorage', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    act(() => {
      result.current.addSetup(ACC, SPA, FERRARI, 'Persisted')
    })
    const raw = localStorage.getItem('rspm.games.v1')
    expect(raw).toContain('Persisted')
  })
})

const gameById = (s: ReturnType<typeof useStore>, id: string) =>
  s.games.find((g) => g.id === id)
const trackById = (s: ReturnType<typeof useStore>, g: string, t: string) =>
  gameById(s, g)?.tracks.find((x) => x.id === t)

describe('game / track / car CRUD', () => {
  it('addGame appends a game and returns its id', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    const before = result.current.games.length

    let id = ''
    act(() => {
      id = result.current.addGame('Forza')
    })

    expect(result.current.games).toHaveLength(before + 1)
    const added = gameById(result.current, id)
    expect(added?.name).toBe('Forza')
    expect(added?.tracks).toEqual([])
  })

  it('addGame falls back to a default name when blank', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    let id = ''
    act(() => {
      id = result.current.addGame('  ')
    })
    expect(gameById(result.current, id)?.name).toBe('New game')
  })

  it('deleteGame removes the game and all its nested data', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    expect(setupsFor(result.current)).toHaveLength(3) // ACC populated

    act(() => {
      result.current.deleteGame(ACC)
    })

    expect(gameById(result.current, ACC)).toBeUndefined()
    expect(setupsFor(result.current)).toHaveLength(0)
  })

  it('addTrack appends to the right game; deleteTrack removes only it', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    const before = gameById(result.current, ACC)!.tracks.length

    let id = ''
    act(() => {
      id = result.current.addTrack(ACC, 'Imola')
    })
    expect(gameById(result.current, ACC)!.tracks).toHaveLength(before + 1)
    expect(trackById(result.current, ACC, id)?.name).toBe('Imola')

    act(() => {
      result.current.deleteTrack(ACC, id)
    })
    expect(trackById(result.current, ACC, id)).toBeUndefined()
    // the seeded Spa track is untouched
    expect(trackById(result.current, ACC, SPA)).toBeDefined()
  })

  it('addCar appends to the right track; deleteCar removes only it', () => {
    const { result } = renderHook(() => useStore(), { wrapper })
    const before = trackById(result.current, ACC, SPA)!.cars.length

    let id = ''
    act(() => {
      id = result.current.addCar(ACC, SPA, 'Audi R8 GT3')
    })
    const cars = () => trackById(result.current, ACC, SPA)!.cars
    expect(cars()).toHaveLength(before + 1)
    expect(cars().find((c) => c.id === id)?.name).toBe('Audi R8 GT3')

    act(() => {
      result.current.deleteCar(ACC, SPA, id)
    })
    expect(cars().some((c) => c.id === id)).toBe(false)
    expect(cars().some((c) => c.id === FERRARI)).toBe(true)
  })
})
