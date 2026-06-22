import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Setting } from './types'
import {
  clampToRange,
  formatValue,
  rangeFraction,
  relativeTime,
  stepValue,
} from './utils'

// A small factory so each test starts from a known control.
function setting(over: Partial<Setting> = {}): Setting {
  return {
    id: 's',
    label: 'Front tyre psi',
    value: 26.1,
    min: 25,
    max: 30,
    step: 0.1,
    unit: 'psi',
    decimals: 1,
    ...over,
  }
}

describe('clampToRange', () => {
  it('snaps a raw value to the nearest step', () => {
    expect(clampToRange(setting(), 26.13)).toBe(26.1)
    expect(clampToRange(setting(), 26.16)).toBe(26.2)
  })

  it('clamps below min and above max', () => {
    expect(clampToRange(setting(), 10)).toBe(25)
    expect(clampToRange(setting(), 99)).toBe(30)
  })

  it('kills floating-point fuzz', () => {
    // 25 + 11 * 0.1 would be 26.1000000000001 without the guard
    const result = clampToRange(setting({ value: 26 }), 26.1)
    expect(result).toBe(26.1)
    expect(Number.isInteger(result * 10)).toBe(true)
  })

  it('honours a non-zero min when snapping', () => {
    const brakeBias = setting({ min: 50, max: 58, step: 0.2, value: 54.5 })
    expect(clampToRange(brakeBias, 54.55)).toBe(54.6)
    expect(clampToRange(brakeBias, 54.45)).toBe(54.4)
  })

  it('works across a negative range (camber)', () => {
    const camber = setting({ min: -4, max: -2, step: 0.1, value: -3.4 })
    expect(clampToRange(camber, -3.42)).toBe(-3.4)
    expect(clampToRange(camber, -5)).toBe(-4)
    expect(clampToRange(camber, 0)).toBe(-2)
  })
})

describe('stepValue', () => {
  it('moves one step in each direction', () => {
    expect(stepValue(setting({ value: 26.1 }), 1)).toBe(26.2)
    expect(stepValue(setting({ value: 26.1 }), -1)).toBe(26)
  })

  it('does not exceed the bounds', () => {
    expect(stepValue(setting({ value: 30 }), 1)).toBe(30)
    expect(stepValue(setting({ value: 25 }), -1)).toBe(25)
  })
})

describe('rangeFraction', () => {
  it('returns 0 at min, 1 at max, 0.5 at midpoint', () => {
    expect(rangeFraction(setting({ value: 25 }))).toBe(0)
    expect(rangeFraction(setting({ value: 30 }))).toBe(1)
    expect(rangeFraction(setting({ value: 27.5 }))).toBe(0.5)
  })

  it('clamps out-of-range values into 0..1', () => {
    expect(rangeFraction(setting({ value: 10 }))).toBe(0)
    expect(rangeFraction(setting({ value: 99 }))).toBe(1)
  })

  it('returns 0 when min === max', () => {
    expect(rangeFraction(setting({ min: 5, max: 5, value: 5 }))).toBe(0)
  })
})

describe('formatValue', () => {
  it('renders with the setting decimals', () => {
    expect(formatValue(setting({ value: 26.1, decimals: 1 }))).toBe('26.1')
    expect(formatValue(setting({ value: 7, decimals: 0 }))).toBe('7')
    expect(formatValue(setting({ value: 0.02, decimals: 2 }))).toBe('0.02')
  })
})

describe('relativeTime', () => {
  const NOW = 1_700_000_000_000

  afterEach(() => {
    vi.useRealTimers()
  })

  function at(msAgo: number) {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    return relativeTime(NOW - msAgo)
  }

  it('handles the full ladder of buckets', () => {
    const MIN = 60_000
    const HOUR = 60 * MIN
    const DAY = 24 * HOUR
    expect(at(30_000)).toBe('just now')
    expect(at(5 * MIN)).toBe('5m ago')
    expect(at(3 * HOUR)).toBe('3h ago')
    expect(at(2 * DAY)).toBe('2d ago')
    expect(at(2 * 7 * DAY)).toBe('2w ago')
    expect(at(60 * DAY)).toBe('2mo ago')
  })
})
