import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Car, Game, Prefs, Setup, Track } from './types'
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
  // mutations — games / tracks / cars
  addGame: (name: string) => string
  deleteGame: (gameId: string) => void
  addTrack: (gameId: string, name: string) => string
  deleteTrack: (gameId: string, trackId: string) => void
  addCar: (gameId: string, trackId: string, name: string) => string
  deleteCar: (gameId: string, trackId: string, carId: string) => void
  // mutations — setups
  addSetup: (gameId: string, trackId: string, carId: string, name: string) => string
  updateSetup: (
    gameId: string,
    trackId: string,
    carId: string,
    setupId: string,
    patch: Partial<Pick<Setup, 'name' | 'weather' | 'trackTempC' | 'fuelL'>>,
  ) => void
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

  // Rebuild the tree while mutating one game's track list.
  const mutateTracks = useCallback(
    (gameId: string, fn: (tracks: Track[]) => Track[]) => {
      setGames((gs) =>
        gs.map((g) => (g.id !== gameId ? g : { ...g, tracks: fn(g.tracks) })),
      )
    },
    [],
  )

  // Rebuild the tree while mutating one track's car list.
  const mutateCars = useCallback(
    (gameId: string, trackId: string, fn: (cars: Car[]) => Car[]) => {
      mutateTracks(gameId, (tracks) =>
        tracks.map((t) => (t.id !== trackId ? t : { ...t, cars: fn(t.cars) })),
      )
    },
    [mutateTracks],
  )

  const addGame = useCallback((name: string) => {
    const id = uid('game')
    setGames((gs) => [...gs, { id, name: name.trim() || 'New game', tracks: [] }])
    return id
  }, [])

  const deleteGame = useCallback((gameId: string) => {
    setGames((gs) => gs.filter((g) => g.id !== gameId))
  }, [])

  const addTrack = useCallback(
    (gameId: string, name: string) => {
      const id = uid('track')
      mutateTracks(gameId, (tracks) => [
        ...tracks,
        { id, name: name.trim() || 'New track', cars: [] },
      ])
      return id
    },
    [mutateTracks],
  )

  const deleteTrack = useCallback(
    (gameId: string, trackId: string) => {
      mutateTracks(gameId, (tracks) => tracks.filter((t) => t.id !== trackId))
    },
    [mutateTracks],
  )

  const addCar = useCallback(
    (gameId: string, trackId: string, name: string) => {
      const id = uid('car')
      mutateCars(gameId, trackId, (cars) => [
        ...cars,
        { id, name: name.trim() || 'New car', setups: {} },
      ])
      return id
    },
    [mutateCars],
  )

  const deleteCar = useCallback(
    (gameId: string, trackId: string, carId: string) => {
      mutateCars(gameId, trackId, (cars) => cars.filter((c) => c.id !== carId))
    },
    [mutateCars],
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

  const updateSetup = useCallback(
    (
      gameId: string,
      trackId: string,
      carId: string,
      setupId: string,
      patch: Partial<Pick<Setup, 'name' | 'weather' | 'trackTempC' | 'fuelL'>>,
    ) => {
      mutateCar(gameId, trackId, carId, (setups) =>
        setups.map((s) =>
          s.id !== setupId ? s : { ...s, ...patch, updated: Date.now() },
        ),
      )
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
      addGame,
      deleteGame,
      addTrack,
      deleteTrack,
      addCar,
      deleteCar,
      addSetup,
      updateSetup,
      updateSetting,
      deleteSetup,
    }),
    [
      games,
      prefs,
      setPrefs,
      resetAll,
      addGame,
      deleteGame,
      addTrack,
      deleteTrack,
      addCar,
      deleteCar,
      addSetup,
      updateSetup,
      updateSetting,
      deleteSetup,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
