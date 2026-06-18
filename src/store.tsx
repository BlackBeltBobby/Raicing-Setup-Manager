import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Game, Prefs, Setup } from './types'
import { blankSheet, seedGames, uid } from './data'

const GAMES_KEY = 'rspm.games.v1'
const PREFS_KEY = 'rspm.prefs.v1'

const DEFAULT_PREFS: Prefs = {
  accent: 'Race Red',
  cleanType: false,
  showRanges: true,
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

interface Store {
  games: Game[]
  prefs: Prefs
  setPrefs: (patch: Partial<Prefs>) => void
  resetAll: () => void
  // mutations
  addSetup: (gameId: string, trackId: string, carId: string, name: string) => string
  updateSetting: (
    gameId: string,
    trackId: string,
    carId: string,
    setupId: string,
    settingId: string,
    value: number,
  ) => void
  deleteSetup: (gameId: string, trackId: string, carId: string, setupId: string) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>(() => load(GAMES_KEY, seedGames()))
  const [prefs, setPrefsState] = useState<Prefs>(() => load(PREFS_KEY, DEFAULT_PREFS))

  useEffect(() => {
    localStorage.setItem(GAMES_KEY, JSON.stringify(games))
  }, [games])
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  }, [prefs])

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((p) => ({ ...p, ...patch }))
  }, [])

  const resetAll = useCallback(() => {
    setGames(seedGames())
    setPrefsState(DEFAULT_PREFS)
  }, [])

  // Helper that rebuilds the tree while mutating one car's setup list.
  const mutateCar = useCallback(
    (
      gameId: string,
      trackId: string,
      carId: string,
      fn: (setups: Setup[]) => Setup[],
    ) => {
      setGames((gs) =>
        gs.map((g) =>
          g.id !== gameId
            ? g
            : {
                ...g,
                tracks: g.tracks.map((t) =>
                  t.id !== trackId
                    ? t
                    : {
                        ...t,
                        cars: t.cars.map((c) =>
                          c.id !== carId
                            ? c
                            : {
                                ...c,
                                setups: {
                                  ...c.setups,
                                  [trackId]: fn(c.setups[trackId] ?? []),
                                },
                              },
                        ),
                      },
                ),
              },
        ),
      )
    },
    [],
  )

  const addSetup = useCallback(
    (gameId: string, trackId: string, carId: string, name: string) => {
      const id = uid('setup')
      mutateCar(gameId, trackId, carId, (setups) => [
        {
          id,
          name: name.trim() || 'Untitled setup',
          weather: 'Dry',
          trackTempC: 26,
          fuelL: 50,
          updated: Date.now(),
          settings: blankSheet(),
        },
        ...setups,
      ])
      return id
    },
    [mutateCar],
  )

  const updateSetting = useCallback(
    (
      gameId: string,
      trackId: string,
      carId: string,
      setupId: string,
      settingId: string,
      value: number,
    ) => {
      mutateCar(gameId, trackId, carId, (setups) =>
        setups.map((s) =>
          s.id !== setupId
            ? s
            : {
                ...s,
                updated: Date.now(),
                settings: s.settings.map((set) =>
                  set.id === settingId ? { ...set, value } : set,
                ),
              },
        ),
      )
    },
    [mutateCar],
  )

  const deleteSetup = useCallback(
    (gameId: string, trackId: string, carId: string, setupId: string) => {
      mutateCar(gameId, trackId, carId, (setups) =>
        setups.filter((s) => s.id !== setupId),
      )
    },
    [mutateCar],
  )

  const value = useMemo<Store>(
    () => ({
      games,
      prefs,
      setPrefs,
      resetAll,
      addSetup,
      updateSetting,
      deleteSetup,
    }),
    [games, prefs, setPrefs, resetAll, addSetup, updateSetting, deleteSetup],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
