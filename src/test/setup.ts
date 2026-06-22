import '@testing-library/jest-dom/vitest'

// This jsdom build ships a non-functional `{}` stub for localStorage, so the
// store's persistence is untestable out of the box. Install a small Map-backed
// Storage polyfill that behaves like the real thing.
class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value))
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null
  }
}

const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true,
})
