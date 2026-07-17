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
    <div class="build-menu" hidden>
      <div class="tower-card tower-card-archer">
        <div class="tower-icon">🏹</div>
        <div class="tower-name" data-i18n="buildArcher">Archer Tower</div>
        <div class="tower-cost"><span class="gold-icon">💰</span> <span class="archer-cost">60</span></div>
        <button class="tower-button build-archer-button" data-i18n="buildArcher">Build</button>
      </div>
      <div class="tower-card tower-card-mage">
        <div class="tower-icon">🔮</div>
        <div class="tower-name" data-i18n="buildMage">Mage Tower</div>
        <div class="tower-cost"><span class="gold-icon">💰</span> <span class="mage-cost">90</span></div>
        <button class="tower-button build-mage-button" data-i18n="buildMage">Build</button>
      </div>
      <div class="tower-card tower-card-sell" hidden>
        <div class="tower-icon">💲</div>
        <div class="tower-name" data-i18n="sell">Sell</div>
        <div class="tower-cost"><span class="gold-icon">💰</span> +<span class="sell-refund">0</span></div>
        <button class="tower-button sell-button" data-i18n="sell">Sell</button>
      </div>
    </div>
    <div class="announcement" aria-live="polite"></div>
    <div class="modal" hidden role="dialog" aria-modal="true">
      <div class="modal-content">
        <h2 class="modal-title" id="modal-title"></h2>
        <div class="modal-body"></div>
        <div class="modal-buttons">
          <button class="modal-button modal-resume-button" data-i18n="resume">Resume</button>
          <button class="modal-button modal-restart-button" data-i18n="restart">Restart</button>
        </div>
      </div>
    </div>
  </div>
</div>
`;
}
