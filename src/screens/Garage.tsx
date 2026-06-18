import { useState } from 'react'
import { useStore } from '../store'
import type { Nav } from '../nav'

export function Garage({ nav }: { nav: Nav }) {
  const { games } = useStore()
  const [q, setQ] = useState('')

  const filtered = games.filter((g) =>
    g.name.toLowerCase().includes(q.trim().toLowerCase()),
  )

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
        {filtered.map((g) => {
          const selected = g.id === 'acc'
          return (
            <button
              key={g.id}
              className={`row ${selected ? 'selected' : ''}`}
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
          )
        })}
        {filtered.length === 0 && <div className="empty">No games match “{q}”.</div>}
        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
