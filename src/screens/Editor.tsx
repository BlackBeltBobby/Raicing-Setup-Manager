import { useRef, useState, type TouchEvent } from 'react'
import { useStore } from '../store'
import type { Nav } from '../nav'
import type { Setting } from '../types'
import {
  clampToRange,
  formatValue,
  rangeFraction,
  stepValue,
} from '../utils'
import { NotFound } from './Tracks'

export function Editor({ nav }: { nav: Nav }) {
  const { games, prefs, updateSetting, updateSetup, deleteSetup } = useStore()
  const { gameId, trackId, carId, setupId } = nav.current
  const [midRace, setMidRace] = useState(false)
  const [focusIdx, setFocusIdx] = useState(0)

  const game = games.find((g) => g.id === gameId)
  const track = game?.tracks.find((t) => t.id === trackId)
  const car = track?.cars.find((c) => c.id === carId)
  const setup = car?.setups[track?.id ?? '']?.find((s) => s.id === setupId)
  if (!game || !track || !car || !setup) return <NotFound nav={nav} what="setup" />

  const apply = (setting: Setting, value: number) =>
    updateSetting(game.id, track.id, car.id, setup.id, setting.id, value)

  const patch = (p: Parameters<typeof updateSetup>[4]) =>
    updateSetup(game.id, track.id, car.id, setup.id, p)

  const rename = () => {
    const name = window.prompt('Rename this setup', setup.name)
    if (name === null) return
    patch({ name: name.trim() || setup.name })
  }

  const remove = () => {
    if (!window.confirm(`Delete “${setup.name}”? This can't be undone.`)) return
    deleteSetup(game.id, track.id, car.id, setup.id)
    nav.back()
  }

  const showRanges = prefs.showRanges

  return (
    <div className="screen">
      <div className="editor-head">
        <button className="crumb" onClick={nav.back} aria-label="Back">
          <span className="chev">‹</span>
        </button>
        <button className="mid name-edit" onClick={rename}>
          {setup.name} <span className="edit-hint">✎</span>
        </button>
        <button className="linkish" onClick={nav.back}>
          Done
        </button>
      </div>

      {/* mid-race toggle */}
      <button
        className="toggle-wrap"
        onClick={() => setMidRace((m) => !m)}
        aria-pressed={midRace}
      >
        <div>
          <div className="toggle-label">Mid-race mode</div>
          <div className="toggle-sub">one big setting at a time</div>
        </div>
        <span className={`switch ${midRace ? 'on' : ''}`}>
          <span className="knob" />
        </span>
      </button>

      {/* conditions — tap to edit */}
      <div className="conditions">
        <button
          className="cond cond-btn"
          onClick={() =>
            patch({ weather: setup.weather === 'Wet' ? 'Dry' : 'Wet' })
          }
        >
          {setup.weather === 'Wet' ? '🌧 Wet' : '☀ Dry'}
        </button>
        <CondStepper
          label={`${setup.trackTempC}°C`}
          atMin={setup.trackTempC <= 5}
          atMax={setup.trackTempC >= 50}
          onDec={() => patch({ trackTempC: setup.trackTempC - 1 })}
          onInc={() => patch({ trackTempC: setup.trackTempC + 1 })}
        />
        {setup.fuelL != null ? (
          <CondStepper
            label={`⛽ ${setup.fuelL}L`}
            atMin={setup.fuelL <= 0}
            atMax={setup.fuelL >= 140}
            onDec={() => patch({ fuelL: Math.max(0, setup.fuelL! - 1) })}
            onInc={() => patch({ fuelL: Math.min(140, setup.fuelL! + 1) })}
          />
        ) : (
          <button className="cond cond-btn" onClick={() => patch({ fuelL: 50 })}>
            ⛽ add fuel
          </button>
        )}
      </div>

      {midRace ? (
        <FocusMode
          settings={setup.settings}
          idx={focusIdx}
          setIdx={setFocusIdx}
          showRanges={showRanges}
          apply={apply}
        />
      ) : (
        <StepperMode
          settings={setup.settings}
          showRanges={showRanges}
          apply={apply}
        />
      )}

      <div className="editor-foot">
        <button className="btn-ghost danger" onClick={remove}>
          🗑 Delete setup
        </button>
      </div>
    </div>
  )
}

// A compact ± control that lives inside the conditions row.
function CondStepper({
  label,
  atMin,
  atMax,
  onDec,
  onInc,
}: {
  label: string
  atMin: boolean
  atMax: boolean
  onDec: () => void
  onInc: () => void
}) {
  return (
    <span className="cond cond-stepper">
      <button
        className="cond-mini"
        disabled={atMin}
        onClick={onDec}
        aria-label={`decrease ${label}`}
      >
        –
      </button>
      <span>{label}</span>
      <button
        className="cond-mini"
        disabled={atMax}
        onClick={onInc}
        aria-label={`increase ${label}`}
      >
        +
      </button>
    </span>
  )
}

// ---- Default mode: stepper rows -----------------------------------------

function StepperMode({
  settings,
  showRanges,
  apply,
}: {
  settings: Setting[]
  showRanges: boolean
  apply: (s: Setting, v: number) => void
}) {
  return (
    <>
      <div className="settings-list">
        {settings.map((s) => (
          <StepperRow key={s.id} setting={s} showRanges={showRanges} apply={apply} />
        ))}
      </div>
      <div className="list-footer">all {settings.length} settings · scroll ↓</div>
    </>
  )
}

function StepperRow({
  setting,
  showRanges,
  apply,
}: {
  setting: Setting
  showRanges: boolean
  apply: (s: Setting, v: number) => void
}) {
  const atMin = setting.value <= setting.min
  const atMax = setting.value >= setting.max
  return (
    <div className="setting">
      <div className="setting-top">
        <div className="setting-name">{setting.label}</div>
        <div className="stepper">
          <button
            className="step-btn minus"
            disabled={atMin}
            onClick={() => apply(setting, stepValue(setting, -1))}
            aria-label={`decrease ${setting.label}`}
          >
            –
          </button>
          <span className="step-val">{formatValue(setting)}</span>
          <button
            className="step-btn plus"
            disabled={atMax}
            onClick={() => apply(setting, stepValue(setting, 1))}
            aria-label={`increase ${setting.label}`}
          >
            +
          </button>
        </div>
      </div>
      {showRanges && (
        <>
          <div className="range-row">
            <span>
              {setting.min.toFixed(setting.decimals)}
              {setting.unit ? ` ${setting.unit}` : ''}
            </span>
            <span className="mid">
              ▸ range ◂ · {setting.step} step
            </span>
            <span>
              {setting.max.toFixed(setting.decimals)}
              {setting.unit ? ` ${setting.unit}` : ''}
            </span>
          </div>
          <div className="bar">
            <span
              className="fill"
              style={{ width: `${rangeFraction(setting) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ---- Mid-race mode: one focused setting ---------------------------------

function FocusMode({
  settings,
  idx,
  setIdx,
  showRanges,
  apply,
}: {
  settings: Setting[]
  idx: number
  setIdx: (i: number) => void
  showRanges: boolean
  apply: (s: Setting, v: number) => void
}) {
  const setting = settings[Math.min(idx, settings.length - 1)]
  const atMin = setting.value <= setting.min
  const atMax = setting.value >= setting.max
  const frac = rangeFraction(setting)

  const prev = () => setIdx(idx > 0 ? idx - 1 : settings.length - 1)
  const next = () => setIdx(idx < settings.length - 1 ? idx + 1 : 0)

  // Horizontal swipe on the focus body changes the active setting (the design's
  // "swipe to change setting" promise, table-stakes for the touch / iOS build).
  const touchX = useRef<number | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.changedTouches[0].clientX
  }
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0) next()
    else prev()
  }

  return (
    <>
      <div className="focus-chips">
        {settings.map((s, i) => (
          <button
            key={s.id}
            className={`chip ${i === idx ? 'active' : ''}`}
            onClick={() => setIdx(i)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        className="focus-body"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="focus-label">{setting.label}</div>
        <div className="focus-value">{formatValue(setting)}</div>
        <div className="focus-unit">{setting.unit || '—'}</div>
        {showRanges && (
          <div className="focus-bar-wrap">
            <div className="focus-bar">
              <span className="fill" style={{ width: `${frac * 100}%` }} />
              <span className="knob" style={{ left: `${frac * 100}%` }} />
            </div>
            <div className="focus-minmax">
              <span>min {setting.min.toFixed(setting.decimals)}</span>
              <span>max {setting.max.toFixed(setting.decimals)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="focus-controls">
        <button
          className="focus-big-btn minus"
          disabled={atMin}
          onClick={() => apply(setting, clampToRange(setting, setting.value - setting.step))}
          aria-label={`decrease ${setting.label}`}
        >
          –
        </button>
        <div className="focus-step">
          {setting.step}
          <br />
          step
        </div>
        <button
          className="focus-big-btn plus"
          disabled={atMax}
          onClick={() => apply(setting, clampToRange(setting, setting.value + setting.step))}
          aria-label={`increase ${setting.label}`}
        >
          +
        </button>
      </div>

      <div className="focus-hint">
        <button className="linkish" onClick={prev} aria-label="Previous setting">
          ←
        </button>
        {'  '}swipe to change setting{'  '}
        <button className="linkish" onClick={next} aria-label="Next setting">
          →
        </button>
      </div>
    </>
  )
}
