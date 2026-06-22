import { useState } from 'react'
import { useStore } from '../store'
import type { Nav } from '../nav'

export function Tracks({ nav }: { nav: Nav }) {
  const { games, addTrack, deleteTrack } = useStore()
  const [q, setQ] = useState('')
  const game = games.find((g) => g.id === nav.current.gameId)
  if (!game) return <NotFound nav={nav} what="game" />

  const filtered = game.tracks.filter((t) =>
    t.name.toLowerCase().includes(q.trim().toLowerCase()),
  )

  const onNew = () => {
    const name = window.prompt('Name this track', 'New track')
    if (name === null) return
    addTrack(game.id, name)
  }

  const onDelete = (id: string, name: string) => {
    if (window.confirm(`Delete “${name}” and all its cars and setups?`))
      deleteTrack(game.id, id)
  }

  return (
    <div className="screen">
      <div className="head">
        <button className="crumb" onClick={nav.back}>
          <span className="chev">‹</span> {game.name}
        </button>
        <h2 className="title sm">Tracks</h2>
      </div>
      <input
        className="search"
        placeholder="⌕ Filter tracks"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="screen-scroll tight">
        {filtered.map((t) => (
          <div className="row-wrap" key={t.id}>
            <button
              className="row"
              onClick={() =>
                nav.push({ view: 'cars', gameId: game.id, trackId: t.id })
              }
            >
              <div>
                <div className="name">{t.name}</div>
                <div className="meta">
                  {t.cars.length ? `${t.cars.length} cars` : 'no cars yet'}
                </div>
              </div>
              <span className="chev">›</span>
            </button>
            <button
              className="row-del"
              aria-label={`Delete ${t.name}`}
              onClick={() => onDelete(t.id, t.name)}
            >
              🗑
            </button>
          </div>
        ))}
        {game.tracks.length === 0 ? (
          <div className="empty">No tracks saved yet.</div>
        ) : (
          filtered.length === 0 && (
            <div className="empty">No tracks match “{q}”.</div>
          )
        )}
        <div style={{ height: 8 }} />
      </div>
      <div className="footer">
        <button className="btn-primary" onClick={onNew}>
          ＋ New track
        </button>
      </div>
    </div>
  )
}

export function NotFound({ nav, what }: { nav: Nav; what: string }) {
  return (
    <div className="screen">
      <div className="head">
        <button className="crumb" onClick={nav.back}>
          <span className="chev">‹</span> Back
        </button>
      </div>
      <div className="empty">That {what} no longer exists.</div>
    </div>
  )
}
