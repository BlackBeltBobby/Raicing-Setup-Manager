export type View = 'garage' | 'tracks' | 'cars' | 'setups' | 'editor' | 'settings'

export interface Frame {
  view: View
  gameId?: string
  trackId?: string
  carId?: string
  setupId?: string
}

export interface Nav {
  current: Frame
  push: (frame: Frame) => void
  back: () => void
  canBack: boolean
  setTab: (view: View) => void
}
