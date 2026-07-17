/**
 * Shadow DOM CSS styles for mini-tower-defense
 * All styles are scoped to shadow DOM - no leakage to host
 */

export function getStyles() {
  return `
:host {
  display: block;
  contain: content;
  box-sizing: border-box;
  width: min(100%, 960px);
  aspect-ratio: 16 / 9;
  --mtd-frame-radius: 8px;
  --mtd-accent: #4a9eff;
  --mtd-panel-bg: rgba(20, 25, 35, 0.9);
  --mtd-text: #e8e8e8;
  --mtd-gold: #ffd700;
  --mtd-health: #ff4444;
  font-family: system-ui, -apple-system, sans-serif;
}

* {
  box-sizing: border-box;
}

.game-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: var(--mtd-frame-radius);
  overflow: hidden;
  position: relative;
}

/* HUD */
.hud {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: var(--mtd-panel-bg);
  border-bottom: 2px solid var(--mtd-accent);
  min-height: 48px;
  flex-shrink: 0;
}

.hud-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--mtd-text);
  font-size: 14px;
  font-weight: 500;
}

.hud-label {
  opacity: 0.8;
}

.hud-value {
  font-weight: 700;
  min-width: 32px;
}

.lives-value {
  color: var(--mtd-health);
}

.gold-value {
  color: var(--mtd-gold);
}

.wave-value {
  color: var(--mtd-accent);
}

.sound-button,
.pause-button {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: var(--mtd-text);
  cursor: pointer;
  padding: 6px 10px;
  font-size: 16px;
  transition: background 0.2s, transform 0.1s;
  line-height: 1;
}

.sound-button:hover,
.pause-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sound-button:active,
.pause-button:active {
  transform: scale(0.95);
}

.sound-button:focus,
.pause-button:focus {
  outline: 2px solid var(--mtd-accent);
  outline-offset: 2px;
}

.sound-button .sound-off {
  display: none;
}

.sound-button.muted .sound-on {
  display: none;
}

.sound-button.muted .sound-off {
  display: inline;
}

/* Stage */
.stage {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0a0a14;
}

/* Build Menu */
.build-menu {
  position: absolute;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: var(--mtd-panel-bg);
  border: 1px solid var(--mtd-accent);
  border-radius: var(--mtd-frame-radius);
}

.build-menu[hidden] {
  display: none;
}

/* Tower Cards */
.tower-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  min-width: 90px;
}

.tower-card[hidden] {
  display: none;
}

.tower-icon {
  font-size: 28px;
  line-height: 1;
}

.tower-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--mtd-text);
  text-align: center;
}

.tower-cost {
  font-size: 13px;
  font-weight: 700;
  color: var(--mtd-gold);
  display: flex;
  align-items: center;
  gap: 4px;
}

.gold-icon {
  font-size: 12px;
}

.tower-button {
  background: var(--mtd-accent);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  transition: background 0.2s, transform 0.1s;
  width: 100%;
}

.tower-button:hover:not(:disabled) {
  background: #3a8eef;
}

.tower-button:active:not(:disabled) {
  transform: scale(0.95);
}

.tower-button:disabled {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.tower-button:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Announcement */
.announcement {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: 700;
  color: var(--mtd-accent);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
}

.announcement.visible {
  opacity: 1;
}

/* Modal */
.modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.modal[hidden] {
  display: none;
}

.modal-content {
  background: var(--mtd-panel-bg);
  border: 2px solid var(--mtd-accent);
  border-radius: var(--mtd-frame-radius);
  padding: 32px 48px;
  text-align: center;
  color: var(--mtd-text);
}

.modal-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--mtd-accent);
}

.modal-title.defeat {
  color: var(--mtd-health);
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.modal-button {
  background: var(--mtd-accent);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 24px;
  transition: background 0.2s, transform 0.1s;
}

.modal-button:hover {
  background: #3a8eef;
}

.modal-button:active {
  transform: scale(0.97);
}

.modal-button:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}

.modal-button.secondary {
  background: rgba(255, 255, 255, 0.15);
}

.modal-button.secondary:hover {
  background: rgba(255, 255, 255, 0.25);
}
`;
}
