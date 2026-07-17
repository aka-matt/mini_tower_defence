/**
 * Shadow DOM HTML template for mini-tower-defense
 * Returns the HTML structure as a string
 */

export function getTemplate() {
  return `
<div class="game-shell" part="shell">
  <div class="hud" part="hud">
    <div class="hud-item lives">
      <span class="hud-label" data-i18n="lives"> Lives</span>
      <span class="hud-value lives-value">10</span>
    </div>
    <div class="hud-item gold">
      <span class="hud-label" data-i18n="gold"> Gold</span>
      <span class="hud-value gold-value">140</span>
    </div>
    <div class="hud-item wave">
      <span class="hud-label" data-i18n="wave"> Wave</span>
      <span class="hud-value wave-value">0/5</span>
    </div>
    <button class="sound-button" aria-label="toggle sound">
      <span class="sound-icon sound-on">🔊</span>
      <span class="sound-icon sound-off" hidden>🔇</span>
    </button>
    <button class="pause-button" aria-label="toggle pause">
      <span class="pause-icon">⏸</span>
    </button>
  </div>
  <div class="stage" part="stage">
    <canvas part="canvas"></canvas>
    <div class="build-menu" hidden></div>
    <div class="announcement" aria-live="polite"></div>
    <div class="modal" hidden></div>
  </div>
</div>
`;
}
