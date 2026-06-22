import { useStore } from '../store'
import { ACCENTS, type AccentName } from '../types'

const ACCENT_NAMES = Object.keys(ACCENTS) as AccentName[]

export function Settings() {
  const { prefs, setPrefs, resetAll } = useStore()

  return (
    <div className="screen">
      <div className="head">
        <h1 className="title">Settings</h1>
        <div className="subtle">Appearance & data</div>
      </div>
      <div className="screen-scroll">
        {/* Accent */}
        <div className="pref">
          <div className="pref-top">
            <div>
              <div className="pref-name">Accent colour</div>
              <div className="pref-sub">used for selected & active states</div>
            </div>
          </div>
          <div className="swatches">
            {ACCENT_NAMES.map((name) => (
              <button
                key={name}
                className={`swatch ${prefs.accent === name ? 'active' : ''}`}
                onClick={() => setPrefs({ accent: name })}
                aria-pressed={prefs.accent === name}
                aria-label={`Accent ${name}`}
              >
                <span className="dot" style={{ background: ACCENTS[name] }} />
                {name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Clean type */}
        <Toggle
          name="Clean type"
          sub="swap hand-drawn font for Work Sans"
          on={prefs.cleanType}
          onToggle={() => setPrefs({ cleanType: !prefs.cleanType })}
        />

        {/* Show ranges */}
        <Toggle
          name="Show ranges"
          sub="min / max bars on every control"
          on={prefs.showRanges}
          onToggle={() => setPrefs({ showRanges: !prefs.showRanges })}
        />

        <div style={{ height: 4 }} />
        <button
          className="btn-ghost"
          onClick={() => {
            if (
              window.confirm(
                'Reset all setups and preferences back to the demo data?',
              )
            )
              resetAll()
          }}
        >
          ↺ Reset demo data
        </button>
        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}

function Toggle({
  name,
  sub,
  on,
  onToggle,
}: {
  name: string
  sub: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      className="pref"
      style={{ width: '100%', textAlign: 'left', background: 'none' }}
      onClick={onToggle}
      aria-pressed={on}
    >
      <div className="pref-top">
        <div>
          <div className="pref-name">{name}</div>
          <div className="pref-sub">{sub}</div>
        </div>
        <span className={`switch ${on ? 'on' : ''}`}>
          <span className="knob" />
        </span>
      </div>
    </button>
  )
}
