# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mini Tower Defense is a single-level tower defense game (~3-5 minutes per session) built as a native Web Component with Shadow DOM. The game features cartoon castle aesthetics, two tower types (archer/mage), three enemy types, and 5 waves. Zero runtime dependencies — all assets (images, audio) are embedded.

**Key constraint:** All random behavior must support injectable seeds for deterministic testing.

## Development Commands

```bash
npm ci          # Install dependencies
npm run dev     # Start Vite dev server with hot reload
npm test        # Run Vitest unit + component tests
npm run test:e2e # Run Playwright E2E tests
npm run build   # Build single-file output to dist/
npm run lint    # Lint (if configured)
```

## Architecture

### Component Structure

`<mini-tower-defense>` is the single custom element. It uses open Shadow DOM for CSS isolation:
- Shadow root contains Canvas (960×540 logical coords), HUD, build menu, control buttons, and result modal
- Game world renders on Canvas; UI is pure DOM within Shadow root
- External CSS variables (`--mtd-*`) allow limited theming

### Module Organization

```
src/
├── config/           # Game balance values, map layout, wave definitions, i18n
├── engine/          # Pure game logic (state machine, path, targeting, collision, wave controller)
├── entities/        # Enemy, Tower, Projectile, Effect (pure JS, no Canvas/DOM coupling)
├── render/          # Canvas rendering, asset loading, coordinate transforms
├── input/           # Pointer controller (mouse + touch via Pointer Events)
├── audio/           # Web Audio API manager (lazy-unlocked on first user gesture)
└── ui/              # HUD, build menu, modal controllers (DOM side)
```

### Key Design Patterns

1. **Fixed timestep game loop:** Simulation runs at 1/60s steps, max 0.25s accumulated. Render via RAF with interpolation. Keeps game speed stable across frame rate fluctuations.

2. **Targeting:** Both tower types use "furthest along path" priority — `pathProgress` descending, then lowest ID as tiebreak. This is fully deterministic.

3. **Entity IDs:** Each entity gets a stable ID (`enemy-1`, `tower-slot-3`, `projectile-18`). Entities use `alive` flags instead of array splicing during iteration.

4. **Projectiles:** Arrows and magic orbs save their target ID and last known position at creation. If target dies, projectile flies to last known position and disappears — no retargeting.

5. **Game state machine:** Pure function `transitionGameState(state, event) -> newState`. No DOM dependencies. All game state frozen in `GameSnapshot` for `getSnapshot()`.

6. **Audio:** `AudioContext` initialized only after first user gesture (browser autoplay policy). Sounds are embedded as ArrayBuffers decoded on demand.

## Public API

```js
// Attributes
element.width = 960        // Canvas width, min 640, max 1920
element.height = 540       // Canvas height, min 360, max 1080
element.locale = 'zh-CN'   // 'zh-CN' | 'en'
element.autoStart = false  // Start on connect
element.muted = false
element.paused = false     // Read/write pause state
element.state              // Readonly: 'idle' | 'running' | 'paused' | 'won' | 'lost' | 'destroyed'

// Methods
element.start()
element.pause()
element.resume()
element.restart()
element.destroy()
element.getSnapshot() -> Readonly<GameSnapshot>

// Events (all bubbles:true, composed:true)
game-start, game-pause, game-resume, wave-start, wave-complete
tower-built, tower-sold, enemy-leaked, game-win, game-lose, game-error
```

## Configuration Files

All magic numbers are centralized:
- `src/config/game-config.js` — tower stats, enemy stats, sell refund rate (60%)
- `src/config/map-config.js` — PATH_POINTS, tower slot positions
- `src/config/waves.js` — 5 wave definitions with enemy composition and timing
- `src/config/i18n.js` — zh-CN and en text strings

## Build Output

`npm run build` produces `dist/mini-tower-defense.js` — a single file with:
- All ES modules bundled (no external deps at runtime)
- SVG/PNG assets as data URLs or strings
- Audio assets as base64 or ArrayBuffer

The dist file must have zero `fetch()` calls and no external URLs.

## Testing Strategy

- **Unit tests:** Pure functions (path math, targeting, damage formula, state transitions, wave scheduling). Use fake timers/RAF, no real AudioContext.
- **Component tests:** Shadow DOM structure, attribute/property sync, events, cleanup on destroy.
- **E2E tests:** Playwright — real browser gameplay, touch simulation, CSS isolation verification.

## File Naming Conventions

- `*.test.js` — Vitest unit/component tests in `tests/unit/` and `tests/component/`
- `*.spec.js` — Playwright E2E specs in `tests/e2e/`
- Engine files are nouns (`path.js`, `targeting.js`); controller files end in `-controller.js`
