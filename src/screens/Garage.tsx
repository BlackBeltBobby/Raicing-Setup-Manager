import { useState } from 'react'
import { useStore } from '../store'
import type { Nav } from '../nav'

export function Garage({ nav }: { nav: Nav }) {
  const { games, addGame, deleteGame } = useStore()
  const [q, setQ] = useState('')

  const filtered = games.filter((g) =>
    g.name.toLowerCase().includes(q.trim().toLowerCase()),
  )

  const onNew = () => {
    const name = window.prompt('Name this game', 'New game')
    if (name === null) return
    addGame(name)
  }

  const onDelete = (id: string, name: string) => {
    if (window.confirm(`Delete “${name}” and all its tracks, cars, and setups?`))
      deleteGame(id)
  }

  return (
    <div className="screen">
      <div className="head">
        <h1 className="title">Garage</h1>
        <div className="subtle">{games.length} games</div>
      </div>
      <input
        className="search"
        placeholder="⌕ Search games & cars"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="screen-scroll">
        {filtered.map((g) => (
          <div className="row-wrap" key={g.id}>
            <button
              className="row"
              onClick={() => nav.push({ view: 'tracks', gameId: g.id })}
            >
              <div>
                <div className="name">{g.name}</div>
                <div className="meta">
                  {g.tracks.length
                    ? `${g.tracks.length} tracks`
                    : 'no tracks yet'}
                </div>
              </div>
              <span className="chev">›</span>
            </button>
            <button
              className="row-del"
              aria-label={`Delete ${g.name}`}
              onClick={() => onDelete(g.id, g.name)}
            >
              🗑
            </button>
          </div>
        ))}
        {games.length === 0 ? (
          <div className="empty">No games saved yet.</div>
        ) : (
          filtered.length === 0 && (
            <div className="empty">No games match “{q}”.</div>
          )
        )}
        <div style={{ height: 8 }} />
      </div>
      <div className="footer">
        <button className="btn-primary" onClick={onNew}>
          ＋ New game
        </button>
      </div>
    </div>
  )
}
