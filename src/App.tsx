import { useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import { ACCENTS } from './types'
import type { Frame, Nav, View } from './nav'
import { Garage } from './screens/Garage'
import { Tracks } from './screens/Tracks'
import { Cars } from './screens/Cars'
import { Setups } from './screens/Setups'
import { Editor } from './screens/Editor'
import { Settings } from './screens/Settings'

export function App() {
  const { prefs } = useStore()
  const [stack, setStack] = useState<Frame[]>([{ view: 'garage' }])

  // Apply the design's configurable props as live CSS variables.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', ACCENTS[prefs.accent])
    root.style.setProperty(
      '--font',
      prefs.cleanType ? "'Work Sans', sans-serif" : "'Patrick Hand', cursive",
    )
  }, [prefs.accent, prefs.cleanType])

  const nav: Nav = useMemo(() => {
    const current = stack[stack.length - 1]
    return {
      current,
      canBack: stack.length > 1,
      push: (frame) => setStack((s) => [...s, frame]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      setTab: (view) => setStack([{ view }]),
    }
  }, [stack])

  const tab: View = stack[0].view === 'settings' ? 'settings' : 'garage'

  return (
    <div className="stage">
      <div className="phone">
        <StatusBar />
        {renderScreen(nav)}
        <TabBar active={tab} nav={nav} />
      </div>
    </div>
  )
}

function renderScreen(nav: Nav) {
  switch (nav.current.view) {
    case 'garage':
      return <Garage nav={nav} />
    case 'tracks':
      return <Tracks nav={nav} />
    case 'cars':
      return <Cars nav={nav} />
    case 'setups':
      return <Setups nav={nav} />
    case 'editor':
      return <Editor nav={nav} />
    case 'settings':
      return <Settings />
    default:
      return <Garage nav={nav} />
  }
}

function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 4 }}>
        <span>▮▮▮</span>
        <span>▼</span>
      </span>
    </div>
  )
}

function TabBar({ active, nav }: { active: View; nav: Nav }) {
  return (
    <div className="tabbar">
      <button
        className={`tab ${active === 'garage' ? 'active' : ''}`}
        onClick={() => nav.setTab('garage')}
      >
        <span className="ico">▤</span>
        <span>Garage</span>
      </button>
      <button className="tab" onClick={() => nav.setTab('garage')}>
        <span className="ico">＋</span>
        <span>New</span>
      </button>
      <button
        className={`tab ${active === 'settings' ? 'active' : ''}`}
        onClick={() => nav.setTab('settings')}
      >
        <span className="ico">⚙</span>
        <span>Settings</span>
      </button>
    </div>
  )
}
