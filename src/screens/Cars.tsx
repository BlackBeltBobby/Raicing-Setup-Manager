import { useStore } from '../store'
import type { Nav } from '../nav'
import { NotFound } from './Tracks'

export function Cars({ nav }: { nav: Nav }) {
  const { games } = useStore()
  const { gameId, trackId } = nav.current
  const game = games.find((g) => g.id === gameId)
  const track = game?.tracks.find((t) => t.id === trackId)
  if (!game || !track) return <NotFound nav={nav} what="track" />

  return (
    <div className="screen">
      <div className="head">
        <button className="crumb" onClick={nav.back}>
          <span className="chev">‹</span> {abbr(game.name)} · {track.name}
        </button>
        <h2 className="title sm">Cars</h2>
      </div>
      <div className="screen-scroll">
        {track.cars.map((c, i) => {
          const count = c.setups[track.id]?.length ?? 0
          return (
            <button
              key={c.id}
              className={`row ${i === 0 ? 'selected' : ''}`}
              onClick={() =>
                nav.push({
                  view: 'setups',
                  gameId: game.id,
                  trackId: track.id,
                  carId: c.id,
                })
              }
            >
              <span className="thumb" />
              <div style={{ flex: 1 }}>
                <div className="name">{c.name}</div>
                <div className="meta">
                  {count === 0
                    ? '— no setups'
                    : `${count} setup${count === 1 ? '' : 's'}`}
                </div>
              </div>
              <span className="chev">›</span>
            </button>
          )
        })}
        {track.cars.length === 0 && (
          <div className="empty">No cars logged at {track.name} yet.</div>
        )}
        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}

function abbr(name: string): string {
  if (name.startsWith('Assetto Corsa')) return 'ACC'
  return name
}
