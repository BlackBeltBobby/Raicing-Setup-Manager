# Racing Setup Preset Manager

A mobile app for sim racers to save track-specific car setups across multiple
games. Built from a [Claude Design](https://claude.ai/design) handoff —
recreating the *Setup Manager Wireframes* pixel-closely as a real, clickable
React app.

> Save track-specific setups across multiple sims & cars. Built for fast tweaks
> mid-lap in a test session — big targets, and every control is clamped to the
> game's real allowed range so you never scroll past a value the sim won't accept.

## Run it

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173). On a desktop the
app renders inside a phone frame; resize narrow (or open on a phone) and it
fills the screen.

## What's in it

**Core flow — drill down Game → Track → Car → Setups**
- **Garage** — pick a game (Assetto Corsa Competizione is fully populated; the
  others are stubs you can browse)
- **Tracks** → **Cars** → **Setups list**, with breadcrumbs and back nav
- Live setup counts per car, weather/temp/fuel tags per setup

**Setup editor**
- **Default mode** — stepper rows (–/+), each showing its allowed range and a
  fill bar
- **Mid-race mode** — flip the toggle and it collapses to one giant setting at a
  time with big touch targets, for nudging values while you drive. **Swipe**
  left/right (or use ← →) to change setting.
- Every control is **clamped to its real min/max and snapped to its step** — the
  core promise of the design. Buttons disable at the limits.
- **Editable conditions** — tap the weather chip to flip Dry/Wet, and use the ±
  chips to adjust track temp and fuel.
- **Rename** a setup by tapping its title; **delete** it from the button at the
  bottom of the editor.

**Settings**
- Accent colour (Race Red / Signal Blue / Track Green)
- Clean type (hand-drawn Patrick Hand ↔ Work Sans)
- Show ranges on/off
- Reset to demo data

All edits — new setups, value changes, preferences — **persist in the browser**
(localStorage). Use *Settings → Reset demo data* to start over.

## Develop

```bash
npm run dev      # start the dev server
npm test         # run the Vitest unit suite (utils + store)
npm run lint     # ESLint
npm run format   # Prettier
npm run build    # type-check + production build to dist/
```

## iOS app (Capacitor)

The same web build runs as a native iOS app via [Capacitor](https://capacitorjs.com)
— it serves `dist/` inside a native WKWebView, reusing this entire codebase. The
generated Xcode project lives in `ios/`.

```bash
npm run build            # produce dist/
npx cap sync ios         # copy the build + native plugins into ios/
npx cap open ios         # open in Xcode, then Run in the iOS Simulator
```

Requires macOS with Xcode. Simulator runs need no Apple Developer account;
device/TestFlight distribution does. State persists in the webview's
localStorage; `src/store.tsx` isolates all persistence so it can swap to
`@capacitor/preferences` later in one file.

## Stack

Vite + React + TypeScript, tested with Vitest, packaged for iOS with Capacitor.
No backend; state lives on the device (localStorage).

```
src/
  data.ts          seed garage (games/tracks/cars/setups) + the 14-control sheet
  types.ts         domain model + accent palette
  store.tsx        React context: state, persistence, mutations
  store.test.tsx   store mutation tests
  utils.ts         range clamping, formatting, relative time
  utils.test.ts    pure-logic tests
  nav.ts           tiny stack-based navigation types
  App.tsx          phone shell, router, tab bar
  screens/         Garage, Tracks, Cars, Setups, Editor, Settings
  styles.css       design tokens + components (from the wireframe CSS)
  test/setup.ts    Vitest setup (jest-dom + localStorage polyfill)
```

## Design source

The original handoff bundle (wireframe HTML, runtime, thumbnail) lives outside
this repo at `~/Downloads/racing-setup-preset-manager/`. The visual tokens —
colours (`#e7e5df` paper, `#20201e` ink), fonts, the OKLCH accents, the 300×638
phone frames — are lifted directly from
`project/Setup Manager Wireframes.dc.html`.
