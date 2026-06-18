import { useState } from 'react'
import { useStore } from '../store'
import type { Nav } from '../nav'

export function Tracks({ nav }: { nav: Nav }) {
  const { games } = useStore()
  const [q, setQ] = useState('')
  const game = games.find((g) => g.id === nav.current.gameId)
  if (!game) return <NotFound nav={nav} what="game" />

  const filtered = game.tracks.filter((t) =>
    t.name.toLowerCase().includes(q.trim().toLowerCase()),
  )

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
        {filtered.map((t, i) => (
          <button
            key={t.id}
            className={`row ${i === 0 ? 'selected' : ''}`}
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
        ))}
        {game.tracks.length === 0 && (
          <div className="empty">
            No tracks for {game.name} yet.
            <br />
            This game is a stub in the demo data.
          </div>
        )}
        <div style={{ height: 8 }} />
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
