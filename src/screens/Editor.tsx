import { useState } from 'react'
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
  const { games, prefs, updateSetting } = useStore()
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

  const showRanges = prefs.showRanges

  return (
    <div className="screen">
      <div className="editor-head">
        <button className="crumb" onClick={nav.back}>
          <span className="chev">‹</span>
        </button>
        <span className="mid">{setup.name}</span>
        <button className="linkish" onClick={nav.back}>
          Save
        </button>
      </div>

      {/* mid-race toggle */}
      <button className="toggle-wrap" onClick={() => setMidRace((m) => !m)}>
        <div>
          <div className="toggle-label">Mid-race mode</div>
          <div className="toggle-sub">one big setting at a time</div>
        </div>
        <span className={`switch ${midRace ? 'on' : ''}`}>
          <span className="knob" />
        </span>
      </button>

      {/* conditions */}
      <div className="conditions">
        <span className="cond">{setup.trackTempC}°C</span>
        {setup.fuelL != null && <span className="cond">⛽ {setup.fuelL}L</span>}
        <span className="cond">{setup.weather === 'Wet' ? '🌧 Wet' : '☀ Dry'}</span>
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
    </div>
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
          >
            –
          </button>
          <span className="step-val">{formatValue(setting)}</span>
          <button
            className="step-btn plus"
            disabled={atMax}
            onClick={() => apply(setting, stepValue(setting, 1))}
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

      <div className="focus-body">
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
        >
          +
        </button>
      </div>

      <div className="focus-hint">
        <button
          className="linkish"
          onClick={() => setIdx(idx > 0 ? idx - 1 : settings.length - 1)}
        >
          ←
        </button>
        {'  '}swipe to change setting{'  '}
        <button
          className="linkish"
          onClick={() => setIdx(idx < settings.length - 1 ? idx + 1 : 0)}
        >
          →
        </button>
      </div>
    </>
  )
}
