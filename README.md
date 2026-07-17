# Mini Tower Defense

A single-level tower defense game (~3-5 minutes per session) built as a native Web Component with Shadow DOM. Zero runtime dependencies — all assets (images, audio) are embedded.

[Online Demo](https://example.com) | [Example Page](./example.html)

## Quick Start

### As an ES Module

```bash
npm install mini-tower-defense
```

```html
<script type="module">
  import 'mini-tower-defense';

  const game = document.querySelector('mini-tower-defense');
  game.addEventListener('game-win', () => console.log('Victory!'));
  game.start();
</script>

<mini-tower-defense></mini-tower-defense>
```

### Standalone Build

The `dist/mini-tower-defense.js` single file works without any build tools:

```html
<script type="module" src="mini-tower-defense.js"></script>
<mini-tower-defense></mini-tower-defense>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | number | 960 | Canvas width (640-1920) |
| `height` | number | 540 | Canvas height (360-1080) |
| `locale` | string | `'zh-CN'` | Language: `'zh-CN'` or `'en'` |
| `auto-start` | boolean | false | Start game on connect |
| `muted` | boolean | false | Start with sound muted |

## Properties

| Property | Type | Read/Write | Description |
|----------|------|------------|-------------|
| `width` | number | read/write | Canvas width |
| `height` | number | read/write | Canvas height |
| `locale` | string | read/write | Language code |
| `autoStart` | boolean | read/write | Auto-start on connect |
| `muted` | boolean | read/write | Sound muted state |
| `paused` | boolean | read/write | Pause state (shortcut for pause()/resume()) |
| `state` | string | read-only | `'idle' \| 'running' \| 'paused' \| 'won' \| 'lost' \| 'destroyed'` |

## Methods

| Method | Description |
|--------|-------------|
| `start()` | Start the game |
| `pause()` | Pause the game |
| `resume()` | Resume from pause |
| `restart()` | Restart the game |
| `destroy()` | Cleanup and destroy component |
| `getSnapshot()` | Get readonly game state snapshot |

## Events

All events bubble and are composed (cross Shadow DOM boundary).

| Event | Detail | Description |
|-------|--------|-------------|
| `game-start` | `{}` | Game started |
| `game-pause` | `{}` | Game paused |
| `game-resume` | `{}` | Game resumed |
| `game-restart` | `{}` | Game restarted |
| `game-win` | `{}` | Victory achieved |
| `game-lose` | `{}` | Defeat |
| `game-error` | `{error: string}` | Error occurred |
| `wave-start` | `{wave: number}` | Wave started |
| `wave-complete` | `{wave: number}` | Wave completed |
| `tower-built` | `{towerId, towerType}` | Tower built |
| `tower-sold` | `{towerId, refund}` | Tower sold |
| `enemy-leaked` | `{enemyId, livesRemaining}` | Enemy reached end |
| `enemy-killed` | `{enemyId, reward}` | Enemy killed |

## CSS Variables

Customize appearance via CSS variables on the host element:

```css
mini-tower-defense {
  --mtd-frame-radius: 12px;
  --mtd-accent: #ff6b6b;
  --mtd-panel-bg: rgba(10, 10, 20, 0.95);
  --mtd-text: #ffffff;
  --mtd-gold: #ffd700;
  --mtd-health: #ff4444;
}
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--mtd-frame-radius` | `8px` | Border radius of main frame |
| `--mtd-accent` | `#4a9eff` | Accent color (borders, highlights) |
| `--mtd-panel-bg` | `rgba(20, 25, 35, 0.9)` | HUD/menu background |
| `--mtd-text` | `#e8e8e8` | Text color |
| `--mtd-gold` | `#ffd700` | Gold display color |
| `--mtd-health` | `#ff4444` | Health/lives color |

## Shadow Parts

Style internal elements via `::part()`:

```css
mini-tower-defense::part(hud) {
  background: darkblue;
}
```

| Part | Description |
|------|-------------|
| `hud` | HUD container |
| `stage` | Game stage (canvas container) |
| `build-menu` | Tower build menu |
| `modal` | Modal dialogs (pause/victory/defeat) |

## Mouse and Touch Controls

- **Click/Tap on tower slot**: Open build menu
- **Click/Tap on build option**: Build tower
- **Click/Tap elsewhere**: Close build menu
- **HUD Sound button**: Toggle sound
- **HUD Pause button**: Pause/Resume game

## Browser Autoplay Policy

Browsers require a user gesture before playing audio. The component handles this automatically:

1. Audio context is created on first user interaction (click/tap)
2. The `muted` attribute can be set initially without user gesture
3. Unmuting after game start requires a user gesture (handled by HUD button)

## Multi-Instance Example

```html
<div style="display: flex; gap: 20px;">
  <div style="width: 50%;">
    <h3>Game 1 (Chinese)</h3>
    <mini-tower-defense id="game1"></mini-tower-defense>
  </div>
  <div style="width: 50%;">
    <h3>Game 2 (English)</h3>
    <mini-tower-defense id="game2" locale="en"></mini-tower-defense>
  </div>
</div>

<script type="module">
  import 'mini-tower-defense';

  const game1 = document.getElementById('game1');
  const game2 = document.getElementById('game2');

  // Independent control
  game1.addEventListener('game-win', () => console.log('Game 1 won!'));
  game2.addEventListener('game-win', () => console.log('Game 2 won!'));

  game1.start();
  // game2 not started yet
</script>
```

## Lifecycle Cleanup

Always call `destroy()` when removing the component programmatically, or simply remove from DOM (the component auto-cleans in `disconnectedCallback`):

```javascript
// Option 1: Remove from DOM (auto-cleans)
container.removeChild(game);

// Option 2: Explicit destroy
game.destroy();

// Option 3: Replace component (auto-cleans old)
container.replaceChild(newGame, oldGame);
```

The `destroy()` method:
- Stops the game loop (cancels RAF)
- Releases audio resources
- Removes all event listeners
- Cleans up UI controllers
- Nullifies all internal references

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome/Edge | Last 2 major versions |
| Firefox | Last 2 major versions |
| Safari | 17+ |
| iOS Safari | 17+ |
| Android Chrome | Last 2 major versions |

**Not supported:** Internet Explorer

## Development Commands

```bash
npm ci          # Install dependencies
npm run dev     # Start Vite dev server with hot reload
npm test        # Run Vitest unit + component tests
npm run test:e2e # Run Playwright E2E tests
npm run build   # Build single-file to dist/
npm run lint    # Lint (if configured)
```

## Architecture Overview

The component uses open Shadow DOM for CSS isolation:

- **Canvas** (960x540 logical coords): Game rendering
- **HUD**: Lives, gold, wave display with sound/pause buttons
- **Build Menu**: Tower selection popup
- **Modal**: Pause/victory/defeat dialogs

Game logic runs at fixed 60fps timestep with interpolation. All state is frozen in `GameSnapshot` for the `getSnapshot()` API.

### Key Files

- `src/mini-tower-defense-element.js` - Main Web Component
- `src/engine/` - Pure game logic (no DOM/Canvas coupling)
- `src/entities/` - Enemy, Tower, Projectile, Effect
- `src/config/` - Game balance values, map, waves, i18n
- `src/render/` - Canvas rendering
- `src/ui/` - HUD, build menu, modal controllers

## License

MIT
