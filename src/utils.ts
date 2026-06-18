import type { Setting } from './types'

// Clamp a raw value into the setting's allowed range, snapped to its step.
// This is the core guarantee from the design: never produce a value the sim
// won't accept.
export function clampToRange(setting: Setting, raw: number): number {
  const { min, max, step } = setting
  const snapped = Math.round((raw - min) / step) * step + min
  const bounded = Math.min(max, Math.max(min, snapped))
  // kill floating-point fuzz like 26.10000000000001
  return Number(bounded.toFixed(6))
}

export function stepValue(setting: Setting, dir: 1 | -1): number {
  return clampToRange(setting, setting.value + dir * setting.step)
}

export function formatValue(setting: Setting): string {
  return setting.value.toFixed(setting.decimals)
}

// 0..1 fill position of the value within its range, for the progress bars.
export function rangeFraction(setting: Setting): number {
  const { min, max, value } = setting
  if (max === min) return 0
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

export function relativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
