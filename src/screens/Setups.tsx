import { useStore } from '../store'
import type { Nav } from '../nav'
import type { Setup } from '../types'
import { relativeTime } from '../utils'
import { NotFound } from './Tracks'

export function Setups({ nav }: { nav: Nav }) {
  const { games, addSetup } = useStore()
  const { gameId, trackId, carId } = nav.current
  const game = games.find((g) => g.id === gameId)
  const track = game?.tracks.find((t) => t.id === trackId)
  const car = track?.cars.find((c) => c.id === carId)
  if (!game || !track || !car) return <NotFound nav={nav} what="car" />

  const setups = car.setups[track.id] ?? []
  // Highlight the genuinely most-recently-edited setup, not a fixed row.
  const recentId = setups.length
    ? setups.reduce((a, b) => (b.updated > a.updated ? b : a)).id
    : null

  const onNew = () => {
    const name = window.prompt('Name this setup', 'Race · 70 min')
    if (name === null) return
    const id = addSetup(game.id, track.id, car.id, name)
    nav.push({
      view: 'editor',
      gameId: game.id,
      trackId: track.id,
      carId: car.id,
      setupId: id,
    })
  }

  return (
    <div className="screen">
      <div className="head">
        <button className="crumb" onClick={nav.back}>
          <span className="chev">‹</span> {car.name}
        </button>
        <h2 className="title sm">{track.name} setups</h2>
      </div>
      <div className="screen-scroll">
        {setups.map((s) => (
          <button
            key={s.id}
            className={`card ${s.id === recentId ? 'selected' : ''}`}
            onClick={() =>
              nav.push({
                view: 'editor',
                gameId: game.id,
                trackId: track.id,
                carId: car.id,
                setupId: s.id,
              })
            }
          >
            <div className="card-top">
              <div className="card-name">{s.name}</div>
              <div className="card-age">{relativeTime(s.updated)}</div>
            </div>
            <SetupTags setup={s} />
          </button>
        ))}
        {setups.length === 0 && (
          <div className="empty">
            No setups saved yet.
            <br />
            Tap “New setup” to start one.
          </div>
        )}
        <div style={{ height: 4 }} />
      </div>
      <div className="footer">
        <button className="btn-primary" onClick={onNew}>
          ＋ New setup
        </button>
      </div>
    </div>
  )
}

function SetupTags({ setup }: { setup: Setup }) {
  return (
    <div className="tags">
      <span className="tag">{setup.weather === 'Wet' ? '🌧 Wet' : '☀ Dry'}</span>
      <span className="tag">{setup.trackTempC}°C track</span>
      {setup.fuelL != null && <span className="tag">⛽ {setup.fuelL} L</span>}
    </div>
  )
}
