import { useStore } from '../store'
import type { Nav } from '../nav'
import { NotFound } from './Tracks'

export function Cars({ nav }: { nav: Nav }) {
  const { games, addCar, deleteCar } = useStore()
  const { gameId, trackId } = nav.current
  const game = games.find((g) => g.id === gameId)
  const track = game?.tracks.find((t) => t.id === trackId)
  if (!game || !track) return <NotFound nav={nav} what="track" />

  const onNew = () => {
    const name = window.prompt('Name this car', 'New car')
    if (name === null) return
    addCar(game.id, track.id, name)
  }

  const onDelete = (id: string, name: string) => {
    if (window.confirm(`Delete “${name}” and all its setups?`))
      deleteCar(game.id, track.id, id)
  }

  return (
    <div className="screen">
      <div className="head">
        <button className="crumb" onClick={nav.back}>
          <span className="chev">‹</span> {abbr(game.name)} · {track.name}
        </button>
        <h2 className="title sm">Cars</h2>
      </div>
      <div className="screen-scroll">
        {track.cars.map((c) => {
          const count = c.setups[track.id]?.length ?? 0
          return (
            <div className="row-wrap" key={c.id}>
              <button
                className="row"
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
              <button
                className="row-del"
                aria-label={`Delete ${c.name}`}
                onClick={() => onDelete(c.id, c.name)}
              >
                🗑
              </button>
            </div>
          )
        })}
        {track.cars.length === 0 && (
          <div className="empty">No cars saved yet.</div>
        )}
        <div style={{ height: 8 }} />
      </div>
      <div className="footer">
        <button className="btn-primary" onClick={onNew}>
          ＋ New car
        </button>
      </div>
    </div>
  )
}

function abbr(name: string): string {
  if (name.startsWith('Assetto Corsa')) return 'ACC'
  return name
}
