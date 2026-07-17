(() => {
  // dist/temp-src/template.js
  function getTemplate() {
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
      <span class="sound-icon sound-on">\u{1F50A}</span>
      <span class="sound-icon sound-off" hidden>\u{1F507}</span>
    </button>
    <button class="pause-button" aria-label="toggle pause">
      <span class="pause-icon">\u23F8</span>
    </button>
  </div>
  <div class="stage" part="stage">
    <canvas part="canvas"></canvas>
    <div class="build-menu" hidden>
      <div class="tower-card tower-card-archer">
        <div class="tower-icon">\u{1F3F9}</div>
        <div class="tower-name" data-i18n="buildArcher">Archer Tower</div>
        <div class="tower-cost"><span class="gold-icon">\u{1F4B0}</span> <span class="archer-cost">60</span></div>
        <button class="tower-button build-archer-button" data-i18n="buildArcher">Build</button>
      </div>
      <div class="tower-card tower-card-mage">
        <div class="tower-icon">\u{1F52E}</div>
        <div class="tower-name" data-i18n="buildMage">Mage Tower</div>
        <div class="tower-cost"><span class="gold-icon">\u{1F4B0}</span> <span class="mage-cost">90</span></div>
        <button class="tower-button build-mage-button" data-i18n="buildMage">Build</button>
      </div>
      <div class="tower-card tower-card-sell" hidden>
        <div class="tower-icon">\u{1F4B2}</div>
        <div class="tower-name" data-i18n="sell">Sell</div>
        <div class="tower-cost"><span class="gold-icon">\u{1F4B0}</span> +<span class="sell-refund">0</span></div>
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

  // dist/temp-src/styles.js
  function getStyles() {
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

  // dist/temp-src/ui/hud-controller.js
  var HUDController = class {
    /**
     * @param {ShadowRoot} shadowRoot
     * @param {I18nMap} i18n
     * @param {Function} getI18nFn - Function to get i18n map for a locale
     */
    constructor(shadowRoot, i18n, getI18nFn) {
      this._shadowRoot = shadowRoot;
      this._i18n = i18n;
      this._getI18n = getI18nFn;
      this._soundClickHandler = null;
      this._pauseClickHandler = null;
      this._livesValue = shadowRoot.querySelector(".lives-value");
      this._goldValue = shadowRoot.querySelector(".gold-value");
      this._waveValue = shadowRoot.querySelector(".wave-value");
      this._soundButton = shadowRoot.querySelector(".sound-button");
      this._pauseButton = shadowRoot.querySelector(".pause-button");
      this._pauseIcon = shadowRoot.querySelector(".pause-icon");
      this._bindEvents();
    }
    _bindEvents() {
      if (this._soundButton) {
        this._soundButton.addEventListener("click", () => {
          if (this._soundClickHandler) {
            this._soundClickHandler();
          }
        });
      }
      if (this._pauseButton) {
        this._pauseButton.addEventListener("click", () => {
          if (this._pauseClickHandler) {
            this._pauseClickHandler();
          }
        });
      }
    }
    /**
     * Update HUD display from game snapshot
     * @param {GameSnapshot} snapshot
     */
    update(snapshot) {
      if (!snapshot) return;
      if (this._livesValue && snapshot.lives !== void 0) {
        this._livesValue.textContent = snapshot.lives;
      }
      if (this._goldValue && snapshot.gold !== void 0) {
        this._goldValue.textContent = snapshot.gold;
      }
      if (this._waveValue && snapshot.wave !== void 0 && snapshot.totalWaves !== void 0) {
        this._waveValue.textContent = `${snapshot.wave}/${snapshot.totalWaves}`;
      }
    }
    /**
     * Update locale and refresh HUD labels
     * @param {'zh-CN' | 'en'} locale
     */
    setLocale(locale) {
      this._i18n = this._getI18n(locale);
      const labeledElements = this._shadowRoot.querySelectorAll("[data-i18n]");
      for (const el of labeledElements) {
        const key = el.getAttribute("data-i18n");
        if (this._i18n[key]) {
          el.textContent = this._i18n[key];
        }
      }
    }
    /**
     * Set sound button click handler
     * @param {Function} handler
     */
    onSoundClick(handler) {
      this._soundClickHandler = handler;
    }
    /**
     * Set pause button click handler
     * @param {Function} handler
     */
    onPauseClick(handler) {
      this._pauseClickHandler = handler;
    }
    /**
     * Update pause button icon based on paused state
     * @param {boolean} isPaused
     */
    setPaused(isPaused) {
      if (this._pauseIcon) {
        this._pauseIcon.textContent = isPaused ? "\u25B6" : "\u23F8";
      }
    }
    /**
     * Update sound button muted state
     * @param {boolean} isMuted
     */
    setMuted(isMuted) {
      if (this._soundButton) {
        if (isMuted) {
          this._soundButton.classList.add("muted");
        } else {
          this._soundButton.classList.remove("muted");
        }
      }
    }
    /**
     * Cleanup event listeners
     */
    destroy() {
      this._soundClickHandler = null;
      this._pauseClickHandler = null;
    }
  };

  // dist/temp-src/config/game-config.js
  var TowerType = Object.freeze({
    ARCHER: "archer",
    MAGE: "mage"
  });
  var EnemyType = Object.freeze({
    SOLDIER: "soldier",
    SCOUT: "scout",
    ARMORED: "armored"
  });
  var TOWER_STATS = Object.freeze({
    [TowerType.ARCHER]: Object.freeze({
      cost: 60,
      damage: 18,
      interval: 0.7,
      // seconds
      range: 145,
      projectileSpeed: 420
    }),
    [TowerType.MAGE]: Object.freeze({
      cost: 90,
      damage: 28,
      interval: 1.1,
      // seconds
      range: 130,
      projectileSpeed: 300
    })
  });
  var ENEMY_STATS = Object.freeze({
    [EnemyType.SOLDIER]: Object.freeze({
      hp: 70,
      speed: 58,
      armor: 2,
      magicRes: 0,
      reward: 14,
      leakDamage: 1
    }),
    [EnemyType.SCOUT]: Object.freeze({
      hp: 48,
      speed: 92,
      armor: 0,
      magicRes: 0,
      reward: 12,
      leakDamage: 1
    }),
    [EnemyType.ARMORED]: Object.freeze({
      hp: 170,
      speed: 38,
      armor: 9,
      magicRes: 2,
      reward: 25,
      leakDamage: 2
    })
  });
  var PLAYER_CONFIG = Object.freeze({
    initialGold: 140,
    initialLives: 10,
    sellRefundRate: 0.6
  });
  function calculatePhysicalDamage(baseDamage, armor) {
    return Math.max(1, baseDamage - armor);
  }
  function calculateMagicDamage(baseDamage, magicRes) {
    return Math.max(1, baseDamage - magicRes);
  }
  function calculateScore(params) {
    const { totalKillRewardGold, lives, elapsedMs, completedWave } = params;
    const baseKillScore = totalKillRewardGold * 10;
    const livesBonus = lives * 100;
    const timeBonus = Math.max(0, 3e4 - Math.floor(elapsedMs / 10));
    const winScore = baseKillScore + livesBonus + timeBonus;
    const loseScore = baseKillScore + completedWave * 100;
    return { baseKillScore, livesBonus, timeBonus, winScore, loseScore };
  }
  var GAME_CONFIG = Object.freeze({
    TowerType,
    EnemyType,
    TOWER_STATS,
    ENEMY_STATS,
    PLAYER_CONFIG,
    calculatePhysicalDamage,
    calculateMagicDamage,
    calculateScore
  });

  // dist/temp-src/ui/build-menu-controller.js
  var BuildMenuController = class {
    /**
     * @param {ShadowRoot} shadowRoot
     * @param {I18nMap} i18n
     * @param {function(): GameSnapshot} getSnapshot
     */
    constructor(shadowRoot, i18n, getSnapshot) {
      this._shadowRoot = shadowRoot;
      this._i18n = i18n;
      this._getSnapshot = getSnapshot;
      this._currentSlotId = null;
      this._currentSlotPos = null;
      this._isShowing = false;
      this._onBuildArcher = null;
      this._onBuildMage = null;
      this._onSell = null;
      this._menu = shadowRoot.querySelector(".build-menu");
      this._archerCard = shadowRoot.querySelector(".tower-card-archer");
      this._mageCard = shadowRoot.querySelector(".tower-card-mage");
      this._sellCard = shadowRoot.querySelector(".tower-card-sell");
      this._archerCost = shadowRoot.querySelector(".archer-cost");
      this._mageCost = shadowRoot.querySelector(".mage-cost");
      this._sellRefund = shadowRoot.querySelector(".sell-refund");
      this._archerButton = shadowRoot.querySelector(".build-archer-button");
      this._mageButton = shadowRoot.querySelector(".build-mage-button");
      this._sellButton = shadowRoot.querySelector(".sell-button");
      this._bindEvents();
    }
    _bindEvents() {
      if (this._archerButton) {
        this._archerButton.addEventListener("click", () => {
          if (this._onBuildArcher && !this._archerButton.disabled) {
            this._onBuildArcher(this._currentSlotId);
          }
        });
      }
      if (this._mageButton) {
        this._mageButton.addEventListener("click", () => {
          if (this._onBuildMage && !this._mageButton.disabled) {
            this._onBuildMage(this._currentSlotId);
          }
        });
      }
      if (this._sellButton) {
        this._sellButton.addEventListener("click", () => {
          if (this._onSell) {
            this._onSell(this._currentSlotId);
          }
        });
      }
    }
    /**
     * Show the build menu for a tower slot
     * @param {string} slotId - Slot identifier (e.g., "tower-slot-0")
     * @param {{x: number, y: number}} slotWorldPos - World position of the slot
     */
    show(slotId, slotWorldPos) {
      if (!this._menu) return;
      this._currentSlotId = slotId;
      this._currentSlotPos = slotWorldPos;
      const snapshot = this._getSnapshot();
      const gold = snapshot.gold || 0;
      const slotIndex = parseInt(slotId.split("-").pop(), 10);
      const occupiedSlot = snapshot.towers?.some((t) => t.slotId === slotIndex);
      if (occupiedSlot) {
        this._showSellMenu(snapshot, slotIndex);
      } else {
        this._showBuildMenu(gold);
      }
      this._positionMenu(slotWorldPos);
      this._menu.hidden = false;
      this._isShowing = true;
    }
    _showBuildMenu(gold) {
      if (this._sellCard) this._sellCard.hidden = true;
      if (this._archerCard) this._archerCard.hidden = false;
      if (this._mageCard) this._mageCard.hidden = false;
      const archerCost = TOWER_STATS[TowerType.ARCHER].cost;
      const mageCost = TOWER_STATS[TowerType.MAGE].cost;
      if (this._archerCost) {
        this._archerCost.textContent = archerCost;
      }
      if (this._mageCost) {
        this._mageCost.textContent = mageCost;
      }
      if (this._archerButton) {
        this._archerButton.disabled = gold < archerCost;
      }
      if (this._mageButton) {
        this._mageButton.disabled = gold < mageCost;
      }
    }
    _showSellMenu(snapshot, slotIndex) {
      if (this._archerCard) this._archerCard.hidden = true;
      if (this._mageCard) this._mageCard.hidden = true;
      if (this._sellCard) this._sellCard.hidden = false;
      const tower = snapshot.towers?.find((t) => t.slotId === slotIndex);
      if (tower) {
        const refund = Math.floor(tower.cost * PLAYER_CONFIG.sellRefundRate);
        if (this._sellRefund) {
          this._sellRefund.textContent = refund;
        }
      }
    }
    /**
     * Position menu near the slot, preferring above, fallback below
     * @param {{x: number, y: number}} slotWorldPos
     */
    _positionMenu(slotWorldPos) {
      if (!this._menu) return;
      const stage = this._shadowRoot.querySelector(".stage");
      if (!stage) return;
      const stageRect = stage.getBoundingClientRect();
      const worldSize = { width: 960, height: 540 };
      const slotX = slotWorldPos.x / worldSize.width * stageRect.width;
      const slotY = slotWorldPos.y / worldSize.height * stageRect.height;
      const menuWidth = 200;
      const menuHeight = 120;
      let top = slotY - menuHeight - 10;
      let left = slotX - menuWidth / 2;
      if (top < 10) {
        top = slotY + 30;
      }
      left = Math.max(10, Math.min(left, stageRect.width - menuWidth - 10));
      top = Math.max(10, Math.min(top, stageRect.height - menuHeight - 10));
      this._menu.style.left = `${left}px`;
      this._menu.style.top = `${top}px`;
      this._menu.style.bottom = "auto";
      this._menu.style.transform = "none";
    }
    /**
     * Hide the build menu
     */
    hide() {
      if (this._menu) {
        this._menu.hidden = true;
      }
      this._isShowing = false;
      this._currentSlotId = null;
      this._currentSlotPos = null;
    }
    /**
     * Check if menu is currently showing
     * @returns {boolean}
     */
    isShowing() {
      return this._isShowing;
    }
    /**
     * Update menu state (e.g., after gold changes)
     */
    update() {
      if (!this._isShowing || !this._currentSlotId) return;
      const snapshot = this._getSnapshot();
      const gold = snapshot.gold || 0;
      const slotIndex = parseInt(this._currentSlotId.split("-").pop(), 10);
      const occupiedSlot = snapshot.towers?.some((t) => t.slotId === slotIndex);
      if (!occupiedSlot) {
        this._showBuildMenu(gold);
      }
    }
    /**
     * Set callback for build archer action
     * @param {function(string): void} callback - Called with slotId
     */
    onBuildArcher(callback) {
      this._onBuildArcher = callback;
    }
    /**
     * Set callback for build mage action
     * @param {function(string): void} callback - Called with slotId
     */
    onBuildMage(callback) {
      this._onBuildMage = callback;
    }
    /**
     * Set callback for sell action
     * @param {function(string): void} callback - Called with slotId
     */
    onSell(callback) {
      this._onSell = callback;
    }
    /**
     * Cleanup
     */
    destroy() {
      this._onBuildArcher = null;
      this._onBuildMage = null;
      this._onSell = null;
    }
  };

  // dist/temp-src/engine/score.js
  function calculateWinScore(totalKillRewardGold, lives, elapsedMs) {
    const baseKillScore = Math.max(0, totalKillRewardGold) * 10;
    const livesBonus = Math.max(0, lives) * 100;
    const safeElapsed = Math.max(0, elapsedMs);
    const timeBonus = Math.max(0, 3e4 - Math.floor(safeElapsed / 10));
    const winScore = baseKillScore + livesBonus + timeBonus;
    return { baseKillScore, livesBonus, timeBonus, winScore };
  }
  function calculateLoseScore(totalKillRewardGold, completedWave) {
    const baseKillScore = Math.max(0, totalKillRewardGold) * 10;
    const safeCompleted = Math.max(0, completedWave);
    const loseScore = baseKillScore + safeCompleted * 100;
    return { baseKillScore, loseScore };
  }
  function calculateScore2(params) {
    const { outcome, totalKillRewardGold = 0, lives = 0, elapsedMs = 0, completedWave = 0 } = params;
    if (outcome === "win") {
      return calculateWinScore(totalKillRewardGold, lives, elapsedMs);
    }
    return calculateLoseScore(totalKillRewardGold, completedWave);
  }

  // dist/temp-src/ui/modal-controller.js
  var ModalController = class {
    /**
     * @param {ShadowRoot} shadowRoot
     * @param {I18nMap} i18n
     */
    constructor(shadowRoot, i18n) {
      this._shadowRoot = shadowRoot;
      this._i18n = i18n;
      this._onResume = null;
      this._onRestart = null;
      this._modal = shadowRoot.querySelector(".modal");
      this._modalContent = shadowRoot.querySelector(".modal-content");
      this._modalTitle = shadowRoot.querySelector(".modal-title");
      this._modalBody = shadowRoot.querySelector(".modal-body");
      this._resumeButton = shadowRoot.querySelector(".modal-resume-button");
      this._restartButton = shadowRoot.querySelector(".modal-restart-button");
      this._boundHandlers = [];
      this._bindEvents();
    }
    _bindEvents() {
      if (this._resumeButton) {
        const handler = () => {
          if (this._onResume) this._onResume();
        };
        this._resumeButton.addEventListener("click", handler);
        this._boundHandlers.push({ button: this._resumeButton, handler });
      }
      if (this._restartButton) {
        const handler = () => {
          if (this._onRestart) this._onRestart();
        };
        this._restartButton.addEventListener("click", handler);
        this._boundHandlers.push({ button: this._restartButton, handler });
      }
    }
    /**
     * Append a labeled score row with safe textContent.
     * @returns {HTMLDivElement}
     */
    _appendRow(parent, label, value, { emphasis } = {}) {
      const row = document.createElement("div");
      row.className = emphasis ? "score-row total" : "score-row";
      const labelEl = document.createElement("span");
      labelEl.textContent = label;
      const valueEl = document.createElement("span");
      valueEl.textContent = String(value);
      row.appendChild(labelEl);
      row.appendChild(valueEl);
      parent.appendChild(row);
      return row;
    }
    /**
     * Clear all children of a node using removeChild (safe in any DOM).
     * @param {Element} node
     */
    _clearNode(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    }
    /**
     * Show victory modal.
     * @param {GameSnapshot} snapshot
     */
    showVictory(snapshot) {
      if (!this._modal || !this._modalContent) return;
      const score = calculateScore2({
        outcome: "win",
        totalKillRewardGold: snapshot.totalKillRewardGold || 0,
        lives: snapshot.lives || 0,
        elapsedMs: snapshot.elapsedMs || 0,
        completedWave: snapshot.wave || 0
      });
      this._modalTitle.textContent = this._i18n.victory || "Victory!";
      this._modalTitle.classList.remove("defeat");
      this._clearNode(this._modalBody);
      const breakdown = document.createElement("div");
      breakdown.className = "score-breakdown";
      this._appendRow(breakdown, this._i18n.killsLabel || "Kills:", score.baseKillScore);
      this._appendRow(breakdown, this._i18n.livesBonusLabel || "Lives Bonus:", score.livesBonus);
      this._appendRow(breakdown, this._i18n.timeBonusLabel || "Time Bonus:", score.timeBonus);
      this._appendRow(breakdown, this._i18n.totalLabel || "Total:", score.winScore, {
        emphasis: true
      });
      this._modalBody.appendChild(breakdown);
      if (this._resumeButton) this._resumeButton.hidden = true;
      if (this._restartButton) this._restartButton.hidden = false;
      this._modal.setAttribute("role", "dialog");
      this._modal.setAttribute("aria-modal", "true");
      this._modal.setAttribute("aria-labelledby", "modal-title");
      this._modal.hidden = false;
      this._restartButton?.focus();
    }
    /**
     * Show defeat modal.
     * @param {GameSnapshot} snapshot
     */
    showDefeat(snapshot) {
      if (!this._modal || !this._modalContent) return;
      const score = calculateScore2({
        outcome: "lose",
        totalKillRewardGold: snapshot.totalKillRewardGold || 0,
        lives: snapshot.lives || 0,
        elapsedMs: snapshot.elapsedMs || 0,
        completedWave: snapshot.wave || 0
      });
      this._modalTitle.textContent = this._i18n.defeat || "Defeat";
      this._modalTitle.classList.add("defeat");
      this._clearNode(this._modalBody);
      const breakdown = document.createElement("div");
      breakdown.className = "score-breakdown";
      this._appendRow(
        breakdown,
        this._i18n.wavesCompletedLabel || "Waves Completed:",
        snapshot.wave || 0
      );
      this._appendRow(breakdown, this._i18n.killsLabel || "Kills:", score.baseKillScore);
      this._appendRow(breakdown, this._i18n.scoreLabel || "Score:", score.loseScore, {
        emphasis: true
      });
      this._modalBody.appendChild(breakdown);
      if (this._resumeButton) this._resumeButton.hidden = true;
      if (this._restartButton) this._restartButton.hidden = false;
      this._modal.setAttribute("role", "dialog");
      this._modal.setAttribute("aria-modal", "true");
      this._modal.setAttribute("aria-labelledby", "modal-title");
      this._modal.hidden = false;
      this._restartButton?.focus();
    }
    /**
     * Show paused modal.
     */
    showPaused() {
      if (!this._modal || !this._modalContent) return;
      this._modalTitle.textContent = this._i18n.pause || "Paused";
      this._modalTitle.classList.remove("defeat");
      this._clearNode(this._modalBody);
      if (this._resumeButton) this._resumeButton.hidden = false;
      if (this._restartButton) this._restartButton.hidden = false;
      this._modal.setAttribute("role", "dialog");
      this._modal.setAttribute("aria-modal", "true");
      this._modal.setAttribute("aria-labelledby", "modal-title");
      this._modal.hidden = false;
      this._resumeButton?.focus();
    }
    /**
     * Hide the modal.
     */
    hide() {
      if (this._modal) this._modal.hidden = true;
    }
    /**
     * Set callback for resume action.
     * @param {function(): void} callback
     */
    onResume(callback) {
      this._onResume = callback;
    }
    /**
     * Set callback for restart action.
     * @param {function(): void} callback
     */
    onRestart(callback) {
      this._onRestart = callback;
    }
    /**
     * Cleanup
     */
    destroy() {
      for (const { button, handler } of this._boundHandlers) {
        button.removeEventListener("click", handler);
      }
      this._boundHandlers = [];
      this._onResume = null;
      this._onRestart = null;
    }
  };

  // dist/temp-src/audio/audio-manager.js
  var SOUND_CONFIGS = {
    build: { frequency: 440, duration: 0.15, type: "sine", gain: 0.3 },
    sell: { frequency: 330, duration: 0.12, type: "triangle", gain: 0.25 },
    "arrow-shot": { frequency: 880, duration: 0.08, type: "square", gain: 0.15 },
    "magic-shot": { frequency: 1200, duration: 0.1, type: "sine", gain: 0.2 },
    hit: { frequency: 220, duration: 0.1, type: "sawtooth", gain: 0.2 },
    "enemy-leak": { frequency: 150, duration: 0.3, type: "sawtooth", gain: 0.3 },
    "wave-start": { frequency: 660, duration: 0.2, type: "triangle", gain: 0.25 },
    victory: { frequency: 880, duration: 0.4, type: "sine", gain: 0.3 },
    defeat: { frequency: 200, duration: 0.5, type: "sawtooth", gain: 0.25 },
    "ui-click": { frequency: 560, duration: 0.05, type: "square", gain: 0.1 }
  };
  function defaultOnError(detail) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("game-error", {
          detail,
          bubbles: true,
          composed: true
        })
      );
    }
  }
  var AudioManager = class {
    /**
     * @param {ErrorReporter} [onError] - Callback used to surface failures.
     *   Defaults to dispatching a `game-error` event on `window`.
     */
    constructor(onError) {
      this._audioContext = null;
      this._muted = false;
      this._unlocked = false;
      this._onError = typeof onError === "function" ? onError : defaultOnError;
    }
    /**
     * Initialize AudioContext on first user gesture.
     * Safe to call repeatedly. Idempotent once unlocked.
     * @returns {Promise<void>}
     */
    async unlock() {
      if (this._unlocked) return;
      try {
        const Ctor = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
        if (!Ctor) {
          this._onError({
            code: "AUDIO_DECODE_FAILED",
            message: "AudioContext is not supported in this environment"
          });
          return;
        }
        this._audioContext = new Ctor();
        const buffer = this._audioContext.createBuffer(1, 1, 22050);
        const source = this._audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this._audioContext.destination);
        source.start(0);
        if (this._audioContext.state === "suspended") {
          await this._audioContext.resume();
        }
        this._unlocked = true;
      } catch (e) {
        this._onError({
          code: "AUDIO_DECODE_FAILED",
          message: `Failed to unlock AudioContext: ${e && e.message ? e.message : String(e)}`
        });
        this._audioContext = null;
      }
    }
    /**
     * Play a sound by name. No-op when muted, not unlocked, or audio failed.
     * @param {string} name
     */
    play(name) {
      if (this._muted || !this._unlocked || !this._audioContext) return;
      const config = SOUND_CONFIGS[name];
      if (!config) return;
      try {
        const oscillator = this._audioContext.createOscillator();
        const gainNode = this._audioContext.createGain();
        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, this._audioContext.currentTime);
        gainNode.gain.setValueAtTime(config.gain, this._audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          1e-3,
          this._audioContext.currentTime + config.duration
        );
        oscillator.connect(gainNode);
        gainNode.connect(this._audioContext.destination);
        oscillator.start(this._audioContext.currentTime);
        oscillator.stop(this._audioContext.currentTime + config.duration);
      } catch (e) {
        this._onError({
          code: "AUDIO_DECODE_FAILED",
          message: `Failed to play sound "${name}": ${e && e.message ? e.message : String(e)}`
        });
      }
    }
    /**
     * Set muted state.
     * @param {boolean} value
     */
    setMuted(value) {
      this._muted = Boolean(value);
    }
    /** @returns {boolean} */
    get muted() {
      return this._muted;
    }
    /**
     * Release AudioContext. After this, calls to play() are silent. Re-unlock by
     * calling unlock() again.
     */
    destroy() {
      if (this._audioContext) {
        try {
          this._audioContext.close();
        } catch (e) {
        }
        this._audioContext = null;
        this._unlocked = false;
      }
    }
  };

  // dist/temp-src/config/i18n.js
  var LOCALE_EN = "en";
  var LOCALE_ZH_CN = "zh-CN";
  var en = Object.freeze({
    lives: "Lives",
    gold: "Gold",
    wave: "Wave",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    restart: "Restart",
    victory: "Victory!",
    defeat: "Defeat",
    buildArcher: "Archer Tower",
    buildMage: "Mage Tower",
    sell: "Sell",
    insufficientGold: "Not enough gold!"
  });
  var zhCN = Object.freeze({
    lives: "\u751F\u547D",
    gold: "\u91D1\u5E01",
    wave: "\u6CE2\u6B21",
    start: "\u5F00\u59CB",
    pause: "\u6682\u505C",
    resume: "\u7EE7\u7EED",
    restart: "\u91CD\u65B0\u5F00\u59CB",
    victory: "\u80DC\u5229\uFF01",
    defeat: "\u5931\u8D25",
    buildArcher: "\u5F13\u7BAD\u5854",
    buildMage: "\u6CD5\u5E08\u5854",
    sell: "\u51FA\u552E",
    insufficientGold: "\u91D1\u5E01\u4E0D\u8DB3\uFF01"
  });
  var I18N = Object.freeze({
    [LOCALE_EN]: en,
    [LOCALE_ZH_CN]: zhCN
  });
  function getI18n(locale) {
    return I18N[locale] || I18N[LOCALE_EN];
  }

  // dist/temp-src/render/coordinates.js
  function clientToWorld(clientX, clientY, canvasRect, worldSize) {
    const x = (clientX - canvasRect.left) * (worldSize.width / canvasRect.width);
    const y = (clientY - canvasRect.top) * (worldSize.height / canvasRect.height);
    return { x, y };
  }
  function hitTestTowerSlot(point, slots, hitRadius = 30) {
    for (const slot of slots) {
      const dx = point.x - slot.x;
      const dy = point.y - slot.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return slot;
      }
    }
    return null;
  }

  // dist/temp-src/config/map-config.js
  var PATH_POINTS = Object.freeze([
    { x: -30, y: 400 },
    { x: 145, y: 400 },
    { x: 245, y: 315 },
    { x: 410, y: 315 },
    { x: 505, y: 420 },
    { x: 665, y: 420 },
    { x: 735, y: 245 },
    { x: 900, y: 245 },
    { x: 990, y: 245 }
  ]);
  var TOWER_SLOTS = Object.freeze([
    { x: 120, y: 340 },
    // Near first bend
    { x: 200, y: 260 },
    // Near second bend
    { x: 330, y: 370 },
    // Near third bend
    { x: 460, y: 370 },
    // Near fourth bend
    { x: 580, y: 340 },
    // Near fifth bend
    { x: 700, y: 290 },
    // Near sixth bend
    { x: 830, y: 190 }
    // Near final stretch
  ]);
  var WORLD_SIZE = Object.freeze({
    width: 960,
    height: 540
  });
  var MAP_CONFIG = Object.freeze({
    PATH_POINTS,
    TOWER_SLOTS,
    WORLD_SIZE
  });

  // dist/temp-src/config/waves.js
  var totalWaves = 5;
  var WAVES = Object.freeze([
    // Wave 1: 8 soldiers
    Object.freeze({
      wave: 1,
      enemies: Object.freeze([
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER
      ]),
      interval: 0.85,
      // seconds between spawns
      prepTime: 4
      // seconds before wave starts
    }),
    // Wave 2: 5 soldiers + 5 scouts
    Object.freeze({
      wave: 2,
      enemies: Object.freeze([
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT
      ]),
      interval: 0.75,
      prepTime: 4
    }),
    // Wave 3: 8 soldiers + 3 armored
    Object.freeze({
      wave: 3,
      enemies: Object.freeze([
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.ARMORED,
        EnemyType.ARMORED,
        EnemyType.ARMORED
      ]),
      interval: 0.9,
      prepTime: 5
    }),
    // Wave 4: 8 scouts + 4 armored
    Object.freeze({
      wave: 4,
      enemies: Object.freeze([
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.ARMORED,
        EnemyType.ARMORED,
        EnemyType.ARMORED,
        EnemyType.ARMORED
      ]),
      interval: 0.7,
      prepTime: 5
    }),
    // Wave 5: 8 soldiers + 8 scouts + 5 armored
    Object.freeze({
      wave: 5,
      enemies: Object.freeze([
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SOLDIER,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.SCOUT,
        EnemyType.ARMORED,
        EnemyType.ARMORED,
        EnemyType.ARMORED,
        EnemyType.ARMORED,
        EnemyType.ARMORED
      ]),
      interval: 0.62,
      prepTime: 5
    })
  ]);
  var WAVE_CONFIG = Object.freeze({
    WAVES,
    totalWaves
  });

  // dist/temp-src/engine/path.js
  function createPath(points) {
    if (!points || points.length < 2) {
      throw new Error("Path requires at least 2 points");
    }
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      segments.push(Object.freeze({
        start: Object.freeze({ x: start.x, y: start.y }),
        end: Object.freeze({ x: end.x, y: end.y }),
        length,
        angle
      }));
    }
    const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
    return Object.freeze({
      totalLength,
      segments: Object.freeze(segments)
    });
  }
  function samplePath(path, distance2) {
    const { totalLength, segments } = path;
    if (distance2 <= 0) {
      return {
        x: segments[0].start.x,
        y: segments[0].start.y,
        angle: segments[0].angle,
        progress: 0
      };
    }
    if (distance2 >= totalLength) {
      const lastSeg2 = segments[segments.length - 1];
      return {
        x: lastSeg2.end.x,
        y: lastSeg2.end.y,
        angle: lastSeg2.angle,
        progress: 1
      };
    }
    let accumulatedLength = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (distance2 < accumulatedLength + seg.length) {
        const localDistance = distance2 - accumulatedLength;
        const t = seg.length > 0 ? localDistance / seg.length : 0;
        const x = seg.start.x + (seg.end.x - seg.start.x) * t;
        const y = seg.start.y + (seg.end.y - seg.start.y) * t;
        return {
          x,
          y,
          angle: seg.angle,
          progress: distance2 / totalLength
        };
      }
      accumulatedLength += seg.length;
    }
    const lastSeg = segments[segments.length - 1];
    return {
      x: lastSeg.end.x,
      y: lastSeg.end.y,
      angle: lastSeg.angle,
      progress: 1
    };
  }

  // dist/temp-src/engine/ids.js
  var _enemyCounter = 0;
  var _towerCounter = 0;
  var _projectileCounter = 0;
  var _effectCounter = 0;
  function nextEnemyId(existingId) {
    if (existingId) return existingId;
    _enemyCounter += 1;
    return `enemy-${_enemyCounter}`;
  }
  function towerIdForSlot(slotIndex) {
    if (slotIndex === void 0 || slotIndex === null || Number.isNaN(slotIndex)) {
      throw new Error("towerIdForSlot requires a numeric slotIndex");
    }
    return `tower-slot-${slotIndex}`;
  }
  function nextProjectileId(existingId) {
    if (existingId) return existingId;
    _projectileCounter += 1;
    return `projectile-${_projectileCounter}`;
  }
  function nextEffectId(existingId) {
    if (existingId) return existingId;
    _effectCounter += 1;
    return `effect-${_effectCounter}`;
  }
  function resetIdCounters(counts = {}) {
    _enemyCounter = counts.enemy || 0;
    _towerCounter = counts.tower || 0;
    _projectileCounter = counts.projectile || 0;
    _effectCounter = counts.effect || 0;
  }

  // dist/temp-src/engine/state-machine.js
  var GameStateType = Object.freeze({
    IDLE: "idle",
    RUNNING: "running",
    PAUSED: "paused",
    WON: "won",
    LOST: "lost",
    DESTROYED: "destroyed"
  });
  var GameEvent = Object.freeze({
    START: "start",
    PAUSE: "pause",
    RESUME: "resume",
    WAVE_COMPLETE: "wave_complete",
    ENEMY_LEAK: "enemy_leak",
    ENEMY_KILL: "enemy_kill",
    BUILD: "build",
    SELL: "sell",
    WIN: "win",
    LOSE: "lose",
    RESTART: "restart",
    TICK: "tick"
    // advance elapsedMs by payload.deltaMs
  });
  function createInitialState() {
    return Object.freeze({
      state: GameStateType.IDLE,
      gold: PLAYER_CONFIG.initialGold,
      lives: PLAYER_CONFIG.initialLives,
      wave: 0,
      elapsedMs: 0,
      score: 0,
      // Cumulative gold earned from kills (separate from current balance,
      // which drops when towers are built). Used by the score formula.
      totalKillRewardGold: 0,
      towers: [],
      enemies: [],
      projectiles: [],
      effects: []
    });
  }
  function deepFreeze(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        deepFreeze(obj[key]);
      }
    });
    return Object.freeze(obj);
  }
  function transitionGameState(state, event, payload = {}) {
    const {
      state: currentState,
      lives,
      wave,
      gold,
      totalKillRewardGold,
      elapsedMs,
      towers
    } = state;
    switch (event) {
      case GameEvent.START:
        if (currentState === GameStateType.IDLE) {
          return deepFreeze({ ...state, state: GameStateType.RUNNING });
        }
        break;
      case GameEvent.PAUSE:
        if (currentState === GameStateType.RUNNING) {
          return deepFreeze({ ...state, state: GameStateType.PAUSED });
        }
        break;
      case GameEvent.RESUME:
        if (currentState === GameStateType.PAUSED) {
          return deepFreeze({ ...state, state: GameStateType.RUNNING });
        }
        break;
      case GameEvent.WAVE_COMPLETE:
        if (currentState === GameStateType.RUNNING) {
          const nextWave = wave + 1;
          if (nextWave > totalWaves) {
            return deepFreeze({ ...state, state: GameStateType.WON, wave: totalWaves });
          }
          return deepFreeze({ ...state, wave: nextWave });
        }
        break;
      case GameEvent.ENEMY_LEAK:
        if (currentState === GameStateType.RUNNING) {
          const newLives = lives - (payload.leakDamage || 1);
          if (newLives <= 0) {
            return deepFreeze({ ...state, lives: 0, state: GameStateType.LOST });
          }
          return deepFreeze({ ...state, lives: newLives });
        }
        break;
      case GameEvent.ENEMY_KILL:
        if (currentState === GameStateType.RUNNING) {
          const { reward } = payload;
          return deepFreeze({
            ...state,
            gold: gold + reward,
            totalKillRewardGold: totalKillRewardGold + reward
          });
        }
        break;
      case GameEvent.BUILD:
        if (currentState === GameStateType.IDLE || currentState === GameStateType.RUNNING) {
          const { towerCost, towerData } = payload;
          if (gold >= towerCost) {
            const newTowers = [
              ...towers,
              { ...towerData, id: towerIdForSlot(towerData.slotId) }
            ];
            return deepFreeze({ ...state, gold: gold - towerCost, towers: newTowers });
          }
        }
        break;
      case GameEvent.SELL:
        if (currentState === GameStateType.IDLE || currentState === GameStateType.RUNNING) {
          const { towerId, refundAmount } = payload;
          const newTowers = towers.filter((t) => t.id !== towerId);
          return deepFreeze({ ...state, gold: gold + refundAmount, towers: newTowers });
        }
        break;
      case GameEvent.WIN:
        if (currentState === GameStateType.RUNNING) {
          return deepFreeze({ ...state, state: GameStateType.WON });
        }
        break;
      case GameEvent.LOSE:
        if (currentState === GameStateType.RUNNING) {
          return deepFreeze({ ...state, state: GameStateType.LOST });
        }
        break;
      case GameEvent.RESTART:
        return createInitialState();
      case GameEvent.TICK:
        if (currentState === GameStateType.RUNNING) {
          const advance = Math.max(0, payload.deltaMs || 0);
          return deepFreeze({ ...state, elapsedMs: elapsedMs + advance });
        }
        break;
    }
    return state;
  }

  // dist/temp-src/engine/wave-controller.js
  function createWaveController(waves) {
    return Object.freeze({
      waves: Object.freeze([...waves]),
      currentWaveIndex: 0,
      // 0-indexed, points to current wave
      state: Object.freeze({
        phase: "idle",
        // 'idle' | 'prep' | 'spawning' | 'wave_complete' | 'all_complete'
        prepTimeRemaining: 0,
        spawnTimer: 0,
        spawnedCount: 0,
        spawningStopped: false
      })
    });
  }
  function spawnEnemy(wave, spawnedCount) {
    const enemyType = wave.enemies[spawnedCount];
    const enemySpec = ENEMY_STATS[enemyType];
    return {
      id: nextEnemyId(),
      type: enemyType,
      spec: { ...enemySpec, type: enemyType }
    };
  }
  function updateWaveController(controller, deltaSeconds, aliveEnemyCount) {
    if (controller.state.phase === "all_complete" || controller.state.spawningStopped) {
      return {
        controller,
        spawns: [],
        events: []
      };
    }
    const { waves, currentWaveIndex, state } = controller;
    const currentWave = waves[currentWaveIndex];
    if (!currentWave) {
      return {
        controller: Object.freeze({
          ...controller,
          state: Object.freeze({ ...state, phase: "all_complete" })
        }),
        spawns: [],
        events: []
      };
    }
    let newPhase = state.phase;
    let newPrepTimeRemaining = state.prepTimeRemaining;
    let newSpawnTimer = state.spawnTimer;
    let newSpawnedCount = state.spawnedCount;
    let newCurrentWaveIndex = currentWaveIndex;
    const events = [];
    const spawns = [];
    switch (state.phase) {
      case "idle": {
        const prepTime = currentWave.prepTime - deltaSeconds;
        newSpawnTimer = 0;
        newSpawnedCount = 0;
        if (prepTime <= 0) {
          newPhase = "spawning";
          newPrepTimeRemaining = 0;
          events.push({ type: "wave_start", wave: currentWaveIndex + 1 });
          if (newSpawnedCount < currentWave.enemies.length) {
            spawns.push(spawnEnemy(currentWave, newSpawnedCount));
            newSpawnedCount++;
            newSpawnTimer = 0;
          }
        } else {
          newPhase = "prep";
          newPrepTimeRemaining = prepTime;
        }
        break;
      }
      case "prep": {
        newPrepTimeRemaining -= deltaSeconds;
        if (newPrepTimeRemaining <= 0) {
          newPhase = "spawning";
          newPrepTimeRemaining = 0;
          newSpawnTimer = 0;
          newSpawnedCount = 0;
          events.push({ type: "wave_start", wave: currentWaveIndex + 1 });
          if (newSpawnedCount < currentWave.enemies.length) {
            spawns.push(spawnEnemy(currentWave, newSpawnedCount));
            newSpawnedCount++;
            newSpawnTimer = 0;
          }
        }
        break;
      }
      case "spawning": {
        if (newSpawnedCount >= currentWave.enemies.length && (aliveEnemyCount ?? 0) === 0) {
          newPhase = "wave_complete";
          events.push({ type: "wave_complete", wave: currentWaveIndex + 1 });
          if (currentWaveIndex >= waves.length - 1) {
            newPhase = "all_complete";
            events.push({ type: "all_waves_complete" });
          }
          break;
        }
        newSpawnTimer += deltaSeconds;
        while (newSpawnTimer >= currentWave.interval && newSpawnedCount < currentWave.enemies.length) {
          newSpawnTimer -= currentWave.interval;
          spawns.push(spawnEnemy(currentWave, newSpawnedCount));
          newSpawnedCount++;
        }
        break;
      }
      case "wave_complete": {
        const nextWaveIndex = currentWaveIndex + 1;
        if (nextWaveIndex < waves.length) {
          const nextWave = waves[nextWaveIndex];
          newCurrentWaveIndex = nextWaveIndex;
          newPhase = "prep";
          newPrepTimeRemaining = nextWave.prepTime;
          newSpawnTimer = 0;
          newSpawnedCount = 0;
        } else {
          newPhase = "all_complete";
          events.push({ type: "all_waves_complete" });
        }
        break;
      }
    }
    const newState = Object.freeze({
      phase: newPhase,
      prepTimeRemaining: Math.max(0, newPrepTimeRemaining),
      spawnTimer: newSpawnTimer,
      spawnedCount: newSpawnedCount,
      spawningStopped: state.spawningStopped
    });
    const newController = Object.freeze({
      ...controller,
      currentWaveIndex: newCurrentWaveIndex,
      state: newState
    });
    return {
      controller: newController,
      spawns,
      events
    };
  }
  function stopWaveController(controller) {
    if (controller.state.spawningStopped || controller.state.phase === "all_complete") {
      return controller;
    }
    return Object.freeze({
      ...controller,
      state: Object.freeze({
        ...controller.state,
        spawningStopped: true
      })
    });
  }

  // dist/temp-src/engine/targeting.js
  function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function selectTarget(tower, enemies, path) {
    if (!tower.alive) {
      return null;
    }
    let bestTarget = null;
    let bestProgress = -1;
    for (const enemy of enemies) {
      if (!enemy.alive) {
        continue;
      }
      const pos = samplePath(path, enemy.distance);
      const dist = distance(tower.x, tower.y, pos.x, pos.y);
      if (dist > tower.range) {
        continue;
      }
      const progress = pos.progress;
      if (progress > bestProgress) {
        bestProgress = progress;
        bestTarget = enemy;
      } else if (progress === bestProgress && bestTarget !== null) {
        const currentIdNum = parseInt(enemy.id.replace(/\D/g, ""), 10);
        const bestIdNum = parseInt(bestTarget.id.replace(/\D/g, ""), 10);
        if (currentIdNum < bestIdNum) {
          bestTarget = enemy;
        }
      }
    }
    return bestTarget;
  }

  // dist/temp-src/engine/collision.js
  function calculateDamage(baseDamage, damageType, enemy) {
    if (damageType === "physical") {
      return Math.max(1, baseDamage - enemy.armor);
    } else if (damageType === "magic") {
      return Math.max(1, baseDamage - enemy.magicRes);
    }
    return Math.max(1, baseDamage);
  }

  // dist/temp-src/entities/projectile.js
  function createProjectile(spec, targetId, startPos) {
    return Object.freeze({
      id: nextProjectileId(),
      targetId,
      damage: spec.damage,
      damageType: spec.damageType,
      speed: spec.speed,
      alive: true,
      x: startPos.x,
      y: startPos.y,
      lastKnownPos: { x: startPos.x, y: startPos.y }
    });
  }
  function advanceProjectile(projectile, deltaSeconds, targetLookup) {
    if (!projectile.alive) {
      return {
        projectile,
        hit: false,
        targetPos: projectile.lastKnownPos
      };
    }
    const target = targetLookup(projectile.targetId);
    let targetPos;
    if (target !== null && target.alive) {
      targetPos = projectile.lastKnownPos;
    } else {
      targetPos = projectile.lastKnownPos;
    }
    const dx = targetPos.x - projectile.x;
    const dy = targetPos.y - projectile.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);
    if (distToTarget <= 10) {
      return {
        projectile: Object.freeze({ ...projectile, alive: false }),
        hit: true,
        targetPos
      };
    }
    const moveDistance = projectile.speed * deltaSeconds;
    let newX, newY;
    if (moveDistance >= distToTarget) {
      newX = targetPos.x;
      newY = targetPos.y;
    } else {
      const nx = dx / distToTarget;
      const ny = dy / distToTarget;
      newX = projectile.x + nx * moveDistance;
      newY = projectile.y + ny * moveDistance;
    }
    return {
      projectile: Object.freeze({ ...projectile, x: newX, y: newY }),
      hit: false,
      targetPos
    };
  }

  // dist/temp-src/entities/enemy.js
  function createEnemy(spec, id) {
    return Object.freeze({
      id,
      type: spec.type || "unknown",
      hp: spec.hp,
      maxHp: spec.hp,
      speed: spec.speed,
      armor: spec.armor,
      magicRes: spec.magicRes,
      reward: spec.reward,
      leakDamage: spec.leakDamage,
      alive: true,
      distance: 0
    });
  }
  function advanceEnemy(enemy, deltaSeconds, path) {
    if (!enemy.alive) {
      return {
        enemy,
        leaked: false,
        distanceDelta: 0
      };
    }
    const distanceDelta = enemy.speed * deltaSeconds;
    const newDistance = enemy.distance + distanceDelta;
    const pathEnd = path.totalLength;
    if (newDistance >= pathEnd) {
      const updatedEnemy2 = Object.freeze({
        ...enemy,
        alive: false,
        distance: pathEnd
      });
      return {
        enemy: updatedEnemy2,
        leaked: true,
        distanceDelta: pathEnd - enemy.distance
      };
    }
    const updatedEnemy = Object.freeze({
      ...enemy,
      distance: newDistance
    });
    return {
      enemy: updatedEnemy,
      leaked: false,
      distanceDelta
    };
  }
  function damageEnemy(enemy, damage, isPhysical) {
    if (!enemy.alive) {
      return enemy;
    }
    const effectiveDamage = damage;
    const newHp = enemy.hp - effectiveDamage;
    if (newHp <= 0) {
      return Object.freeze({
        ...enemy,
        hp: 0,
        alive: false
      });
    }
    return Object.freeze({
      ...enemy,
      hp: newHp
    });
  }

  // dist/temp-src/entities/effect.js
  var EffectType = Object.freeze({
    DEATH_PUFF: "death-puff",
    HIT_SPARK: "hit-spark"
  });
  function createEffect(type, x, y, id) {
    return Object.freeze({
      id: id || nextEffectId(),
      type,
      x,
      y,
      alive: true,
      age: 0,
      // seconds since creation
      lifetime: type === EffectType.DEATH_PUFF ? 0.5 : 0.3
      // seconds
    });
  }
  function advanceEffect(effect, deltaSeconds) {
    if (!effect.alive) {
      return { effect, alive: false };
    }
    const newAge = effect.age + deltaSeconds;
    const alive = newAge < effect.lifetime;
    const updatedEffect = Object.freeze({
      ...effect,
      age: newAge,
      alive
    });
    return { effect: updatedEffect, alive };
  }
  function getEffectProgress(effect) {
    if (effect.lifetime === 0) {
      return 1;
    }
    return Math.min(1, effect.age / effect.lifetime);
  }
  function getEffectScale(effect) {
    const progress = getEffectProgress(effect);
    switch (effect.type) {
      case EffectType.DEATH_PUFF:
        return 1 + progress * 0.5;
      case EffectType.HIT_SPARK:
        return 1 - progress * 0.5;
      default:
        return 1;
    }
  }
  function getEffectAlpha(effect) {
    const progress = getEffectProgress(effect);
    if (progress > 0.5) {
      return 1 - (progress - 0.5) * 2;
    }
    return 1;
  }

  // dist/temp-src/engine/game-engine.js
  var ENTITY_CAPS = Object.freeze({
    ENEMIES: 40,
    PROJECTILES: 80,
    EFFECTS: 100
  });
  var GameEngine = class {
    constructor() {
      this._state = createInitialState();
      this._towerSlots = Object.freeze(
        TOWER_SLOTS.map(
          (pos, index) => Object.freeze({
            index,
            x: pos.x,
            y: pos.y,
            towerId: null
          })
        )
      );
      this._towerCooldowns = /* @__PURE__ */ new Map();
      this._waveController = createWaveController(WAVES);
      resetIdCounters();
    }
    /** @returns {Readonly<GameState>} */
    get state() {
      return this._state;
    }
    /** @returns {Readonly<Array>} */
    get towerSlots() {
      return this._towerSlots;
    }
    /** @returns {Readonly<GameState>} */
    getSnapshot() {
      return this._state;
    }
    /**
     * Build a tower on a slot.
     * @param {number} slotIndex
     * @param {string} towerType
     * @returns {CommandResult}
     */
    buildTower(slotIndex, towerType) {
      if (slotIndex < 0 || slotIndex >= this._towerSlots.length) {
        return { ok: false, code: "INVALID_TOWER" };
      }
      if (!TOWER_STATS[towerType]) {
        return { ok: false, code: "INVALID_TOWER" };
      }
      const slot = this._towerSlots[slotIndex];
      if (slot.towerId !== null) {
        return { ok: false, code: "SLOT_OCCUPIED" };
      }
      const spec = TOWER_STATS[towerType];
      if (this._state.gold < spec.cost) {
        return { ok: false, code: "INSUFFICIENT_GOLD" };
      }
      const towerData = {
        type: towerType,
        slotId: slotIndex,
        x: slot.x,
        y: slot.y,
        cost: spec.cost,
        damage: spec.damage,
        range: spec.range,
        attackInterval: spec.interval,
        projectileSpeed: spec.projectileSpeed
      };
      const newState = transitionGameState(this._state, GameEvent.BUILD, {
        towerCost: spec.cost,
        towerData
      });
      const newSlots = this._towerSlots.map((s, i) => {
        if (i === slotIndex) {
          return Object.freeze({ ...s, towerId: `tower-slot-${slotIndex}` });
        }
        return s;
      });
      this._state = Object.freeze(newState);
      this._towerSlots = Object.freeze(newSlots);
      return { ok: true, snapshot: this._state };
    }
    /**
     * Sell a tower from a slot. Returns the refund amount on success.
     * @param {number} slotIndex
     * @returns {CommandResult}
     */
    sellTower(slotIndex) {
      if (slotIndex < 0 || slotIndex >= this._towerSlots.length) {
        return { ok: false, code: "INVALID_TOWER" };
      }
      const slot = this._towerSlots[slotIndex];
      if (slot.towerId === null) {
        return { ok: false, code: "SLOT_EMPTY" };
      }
      const tower = this._state.towers.find((t) => t.id === slot.towerId);
      if (!tower) {
        return { ok: false, code: "SLOT_EMPTY" };
      }
      const refundAmount = Math.floor(tower.cost * PLAYER_CONFIG.sellRefundRate);
      const newState = transitionGameState(this._state, GameEvent.SELL, {
        towerId: slot.towerId,
        refundAmount
      });
      const newSlots = this._towerSlots.map((s, i) => {
        if (i === slotIndex) {
          return Object.freeze({ ...s, towerId: null });
        }
        return s;
      });
      this._state = Object.freeze(newState);
      this._towerSlots = Object.freeze(newSlots);
      return { ok: true, snapshot: this._state, refund: refundAmount };
    }
    /** @returns {{events: Array}} */
    start() {
      if (this._state.state !== GameStateType.IDLE) {
        return { events: [] };
      }
      this._state = transitionGameState(this._state, GameEvent.START);
      return { events: [{ type: "game-start" }] };
    }
    /** @returns {Readonly<WaveController>} */
    getWaveController() {
      return this._waveController;
    }
    /**
     * Tick the game engine one fixed step.
     * @param {number} deltaSeconds
     * @param {Enemy[]} enemies
     * @param {PathModel} path
     * @returns {{enemies: Enemy[], events: Array}}
     */
    tick(deltaSeconds, enemies, path) {
      if (this._state.state !== GameStateType.RUNNING) {
        return { enemies, events: [] };
      }
      const events = [];
      let updatedEnemies = [...enemies];
      let newProjectiles = [...this._state.projectiles];
      let newEffects = [...this._state.effects];
      const deltaMs = Math.max(0, deltaSeconds) * 1e3;
      this._state = transitionGameState(this._state, GameEvent.TICK, { deltaMs });
      const findEnemyById = (id) => updatedEnemies.find((e) => e.id === id) || null;
      const updateEnemy = (u) => {
        updatedEnemies = updatedEnemies.map((e) => e.id === u.id ? u : e);
      };
      const aliveEnemyCount = updatedEnemies.filter((e) => e.alive).length;
      const waveResult = updateWaveController(this._waveController, deltaSeconds, aliveEnemyCount);
      this._waveController = waveResult.controller;
      for (const spawn of waveResult.spawns) {
        if (newEffects.length >= ENTITY_CAPS.EFFECTS) {
          newEffects = newEffects.slice(newEffects.length - ENTITY_CAPS.EFFECTS + 1);
        }
        const enemy = createEnemy(spawn.spec, spawn.id);
        updatedEnemies.push(enemy);
      }
      for (const waveEvent of waveResult.events) {
        switch (waveEvent.type) {
          case "wave_start":
            events.push({ type: "wave-start", wave: waveEvent.wave });
            break;
          case "wave_complete":
            events.push({ type: "wave-complete", wave: waveEvent.wave });
            this._state = transitionGameState(this._state, GameEvent.WAVE_COMPLETE);
            break;
          case "all_waves_complete":
            this._pendingWinWave = waveEvent.wave;
            break;
        }
      }
      for (const enemy of updatedEnemies) {
        if (!enemy.alive) continue;
        const result = advanceEnemy(enemy, deltaSeconds, path);
        updateEnemy(result.enemy);
        if (result.leaked) {
          const leakEvents = this.processEnemyLeak(enemy.id, enemy.leakDamage);
          events.push(...leakEvents);
        }
      }
      const towerEvents = [];
      for (const tower of this._state.towers) {
        if (!tower.alive) continue;
        let cooldown = this._towerCooldowns.get(tower.id) || 0;
        cooldown = Math.max(0, cooldown - deltaSeconds);
        if (cooldown === 0) {
          const target = selectTarget(tower, updatedEnemies, path);
          if (target !== null) {
            const targetPos = samplePath(path, target.distance);
            if (newProjectiles.length < ENTITY_CAPS.PROJECTILES) {
              const projectile = createProjectile(
                {
                  speed: tower.projectileSpeed,
                  damage: tower.damage,
                  damageType: tower.type === TowerType.ARCHER ? "physical" : "magic"
                },
                target.id,
                { x: targetPos.x, y: targetPos.y }
              );
              newProjectiles = [...newProjectiles, projectile];
              cooldown = tower.attackInterval;
              towerEvents.push({ type: "tower-attack", towerId: tower.id, targetId: target.id });
            }
          }
        }
        this._towerCooldowns.set(tower.id, cooldown);
      }
      events.push(...towerEvents);
      const advancedProjectiles = [];
      for (const projectile of newProjectiles) {
        if (!projectile.alive) continue;
        const target = findEnemyById(projectile.targetId);
        let withUpdatedTarget = projectile;
        if (target !== null && target.alive) {
          const targetPos = samplePath(path, target.distance);
          withUpdatedTarget = Object.freeze({
            ...projectile,
            lastKnownPos: { x: targetPos.x, y: targetPos.y }
          });
        }
        const result = advanceProjectile(withUpdatedTarget, deltaSeconds, findEnemyById);
        if (result.hit) {
          const hitTarget = findEnemyById(projectile.targetId);
          if (hitTarget !== null && hitTarget.alive) {
            const damage = calculateDamage(projectile.damage, projectile.damageType, hitTarget);
            const damagedEnemy = damageEnemy(hitTarget, damage, projectile.damageType === "physical");
            updateEnemy(damagedEnemy);
            if (newEffects.length < ENTITY_CAPS.EFFECTS) {
              newEffects.push(
                createEffect(EffectType.HIT_SPARK, result.targetPos.x, result.targetPos.y)
              );
            }
            events.push({
              type: "projectile-hit",
              projectileId: projectile.id,
              targetId: projectile.targetId,
              damage
            });
            if (!damagedEnemy.alive) {
              const ks = transitionGameState(this._state, GameEvent.ENEMY_KILL, {
                reward: hitTarget.reward
              });
              this._state = Object.freeze(ks);
              const enemyPos = samplePath(path, hitTarget.distance);
              if (newEffects.length < ENTITY_CAPS.EFFECTS) {
                newEffects.push(createEffect(EffectType.DEATH_PUFF, enemyPos.x, enemyPos.y));
              } else if (newEffects.length > 0) {
                newEffects = newEffects.slice(1);
                newEffects.push(createEffect(EffectType.DEATH_PUFF, enemyPos.x, enemyPos.y));
              }
            }
          }
        } else {
          advancedProjectiles.push(result.projectile);
        }
      }
      const advancedEffects = [];
      for (const effect of newEffects) {
        const result = advanceEffect(effect, deltaSeconds);
        if (result.alive) advancedEffects.push(result.effect);
      }
      this._state = Object.freeze({
        ...this._state,
        projectiles: Object.freeze(advancedProjectiles),
        effects: Object.freeze(advancedEffects)
      });
      if (this._pendingWinWave !== void 0) {
        this._state = transitionGameState(this._state, GameEvent.WIN);
        events.push({ type: "game-win" });
        this._pendingWinWave = void 0;
      }
      const aliveEnemies = updatedEnemies.filter((e) => e.alive);
      return { enemies: aliveEnemies, events };
    }
    /**
     * Process an enemy leak (an enemy reached the castle).
     * @param {string} enemyId
     * @param {number} leakDamage
     * @returns {Array}
     */
    processEnemyLeak(enemyId, leakDamage) {
      const events = [];
      const newState = transitionGameState(this._state, GameEvent.ENEMY_LEAK, { leakDamage });
      this._state = Object.freeze(newState);
      events.push({
        type: "enemy-leak",
        enemyType: void 0,
        // filled in by host element from lookup if needed
        damage: leakDamage,
        livesRemaining: this._state.lives
      });
      if (this._state.state === GameStateType.LOST) {
        events.push({ type: "game-lose" });
        this._waveController = stopWaveController(this._waveController);
      }
      return events;
    }
    /** Reset the engine to initial state. Safe to call repeatedly. */
    reset() {
      this._state = createInitialState();
      this._towerCooldowns.clear();
      this._waveController = createWaveController(WAVES);
      this._pendingWinWave = void 0;
      resetIdCounters();
    }
  };

  // dist/temp-src/engine/game-loop.js
  var FIXED_TIMESTEP = 1 / 60;
  var MAX_ACCUMULATED_TIME = 0.25;
  function createGameLoop({ update, render, now, requestFrame, cancelFrame }) {
    let rafId = null;
    let accumulatedTime = 0;
    let startTime = 0;
    let pausedTime = 0;
    let elapsedMs = 0;
    let running = false;
    let paused = false;
    function loop() {
      if (!running) {
        return;
      }
      const currentTime = now();
      const deltaMs = currentTime - startTime;
      startTime = currentTime;
      if (!paused) {
        elapsedMs += deltaMs;
        let deltaSeconds = deltaMs / 1e3;
        if (deltaSeconds > MAX_ACCUMULATED_TIME) {
          deltaSeconds = MAX_ACCUMULATED_TIME;
        }
        accumulatedTime += deltaSeconds;
        while (accumulatedTime >= FIXED_TIMESTEP) {
          update(FIXED_TIMESTEP);
          accumulatedTime -= FIXED_TIMESTEP;
        }
        const interpolation = accumulatedTime / FIXED_TIMESTEP;
        render(interpolation);
      }
      rafId = requestFrame(loop);
    }
    const gameLoop = {
      /**
       * Start the game loop
       */
      start() {
        if (running) {
          return;
        }
        running = true;
        paused = false;
        startTime = now();
        elapsedMs = 0;
        accumulatedTime = 0;
        rafId = requestFrame(loop);
      },
      /**
       * Pause the game loop - stops update calls but render may still be called by RAF
       */
      pause() {
        if (!running) {
          return;
        }
        paused = true;
        pausedTime = elapsedMs;
      },
      /**
       * Resume the game loop from paused state
       */
      resume() {
        if (!running) {
          return;
        }
        if (!paused) {
          return;
        }
        paused = false;
        startTime = now();
      },
      /**
       * Stop the game loop and cancel the RAF
       */
      stop() {
        if (!running) {
          return;
        }
        running = false;
        paused = false;
        if (rafId !== null) {
          cancelFrame(rafId);
          rafId = null;
        }
      },
      /**
       * Check if the loop is currently running
       * @returns {boolean}
       */
      isRunning() {
        return running;
      },
      /**
       * Get elapsed time in milliseconds
       * @returns {number}
       */
      getElapsedMs() {
        if (!running) {
          return 0;
        }
        if (paused) {
          return pausedTime;
        }
        return elapsedMs;
      },
      /**
       * Get the fixed timestep value
       * @returns {number}
       */
      getFixedTimestep() {
        return FIXED_TIMESTEP;
      }
    };
    return Object.freeze(gameLoop);
  }

  // dist/temp-src/render/asset-store.js
  var ASSET_KEYS = Object.freeze([
    "map-background",
    "castle",
    "tower-slot",
    "tower-archer",
    "tower-mage",
    "enemy-soldier",
    "enemy-scout",
    "enemy-armored",
    "projectile-arrow",
    "projectile-orb",
    "ui-heart",
    "ui-coin"
  ]);
  var AssetStore = class {
    constructor() {
      this._assets = /* @__PURE__ */ new Map();
      this._loaded = false;
    }
    /**
     * Initialize assets with embedded SVG placeholder strings
     * Each asset is a simple colored geometric shape
     */
    _initializeAssets() {
      this._assets.set("map-background", `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <!-- Sky -->
  <rect fill="#87CEEB" width="960" height="300"/>
  <!-- Grass -->
  <rect fill="#4a7c4e" y="300" width="960" height="240"/>
  <!-- Grass detail -->
  <rect fill="#5a8c5e" y="400" width="960" height="140"/>
  <!-- Path area hint -->
  <rect fill="#8b7355" y="395" width="960" height="50" opacity="0.3"/>
</svg>`);
      this._assets.set("castle", `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <!-- Main wall -->
  <rect fill="#8b7355" x="10" y="30" width="60" height="50"/>
  <!-- Tower left -->
  <rect fill="#7a6245" x="20" y="10" width="15" height="30"/>
  <!-- Tower right -->
  <rect fill="#7a6245" x="45" y="10" width="15" height="30"/>
  <!-- Battlements -->
  <rect fill="#6b5135" x="22" y="5" width="4" height="8"/>
  <rect fill="#6b5135" x="28" y="5" width="4" height="8"/>
  <rect fill="#6b5135" x="48" y="5" width="4" height="8"/>
  <rect fill="#6b5135" x="54" y="5" width="4" height="8"/>
  <!-- Door -->
  <rect fill="#5a4135" x="30" y="50" width="20" height="30" rx="10" ry="5"/>
  <!-- Roof center -->
  <polygon fill="#5a4135" points="35,5 45,5 40,15"/>
</svg>`);
      this._assets.set("tower-slot", `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <!-- Shadow -->
  <ellipse fill="#5a4a3f" cx="25" cy="38" rx="22" ry="10"/>
  <!-- Platform top -->
  <ellipse fill="#7b6b5f" cx="25" cy="32" rx="20" ry="9"/>
  <!-- Platform inner -->
  <ellipse fill="#6b5b4f" cx="25" cy="30" rx="18" ry="8"/>
  <!-- Center marker -->
  <circle fill="#5a4a3f" cx="25" cy="30" r="3"/>
</svg>`);
      this._assets.set("tower-archer", `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60">
  <!-- Base -->
  <rect fill="#7a6b5a" x="10" y="20" width="30" height="40" rx="2"/>
  <!-- Roof platform -->
  <rect fill="#6a5b4a" x="5" y="15" width="40" height="10" rx="2"/>
  <!-- Left tower -->
  <rect fill="#5a4b3a" x="8" y="5" width="8" height="15"/>
  <!-- Right tower -->
  <rect fill="#5a4b3a" x="34" y="5" width="8" height="15"/>
  <!-- Battlements -->
  <rect fill="#4a3b2a" x="9" y="2" width="5" height="5"/>
  <rect fill="#4a3b2a" x="36" y="2" width="5" height="5"/>
  <!-- Arrow slits -->
  <rect fill="#3a2b1a" x="20" y="28" width="3" height="10"/>
  <rect fill="#3a2b1a" x="27" y="28" width="3" height="10"/>
  <!-- Door -->
  <rect fill="#2a1b0a" x="21" y="45" width="8" height="15" rx="4" ry="2"/>
</svg>`);
      this._assets.set("tower-mage", `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60">
  <!-- Base -->
  <rect fill="#5a4a6a" x="10" y="20" width="30" height="40" rx="2"/>
  <!-- Roof platform -->
  <rect fill="#4a3a5a" x="5" y="15" width="40" height="10" rx="2"/>
  <!-- Spire -->
  <polygon fill="#3a2a4a" points="25,0 35,15 15,15"/>
  <!-- Crystal -->
  <circle fill="#7a5aaa" cx="25" cy="8" r="5"/>
  <circle fill="#9a7aca" cx="23" cy="6" r="2"/>
  <!-- Magic symbol -->
  <rect fill="#2a1a3a" x="20" y="32" width="10" height="4"/>
  <circle fill="#7a5aaa" cx="25" cy="34" r="3"/>
  <!-- Door -->
  <rect fill="#2a1a3a" x="21" y="45" width="8" height="15" rx="4" ry="2"/>
</svg>`);
      this._assets.set("enemy-soldier", `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
  <!-- Body -->
  <ellipse fill="#c44" cx="15" cy="20" rx="8" ry="10"/>
  <!-- Head -->
  <circle fill="#fa0" cx="15" cy="8" r="6"/>
  <!-- Helmet -->
  <rect fill="#333" x="10" y="4" width="10" height="4" rx="1"/>
  <!-- Eyes -->
  <circle fill="#fff" cx="12" cy="8" r="1.5"/>
  <circle fill="#fff" cx="18" cy="8" r="1.5"/>
</svg>`);
      this._assets.set("enemy-scout", `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <!-- Body -->
  <ellipse fill="#4a4" cx="12" cy="16" rx="6" ry="8"/>
  <!-- Head -->
  <circle fill="#fc0" cx="12" cy="6" r="5"/>
  <!-- Hood -->
  <polygon fill="#333" points="7,3 17,3 15,6 9,6"/>
  <!-- Eyes -->
  <circle fill="#fff" cx="10" cy="6" r="1"/>
  <circle fill="#fff" cx="14" cy="6" r="1"/>
</svg>`);
      this._assets.set("enemy-armored", `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <!-- Body armor -->
  <ellipse fill="#668" cx="18" cy="24" rx="12" ry="12"/>
  <!-- Head with helmet -->
  <circle fill="#888" cx="18" cy="10" r="8"/>
  <!-- Helmet visor -->
  <rect fill="#555" x="6" y="6" width="24" height="6" rx="2"/>
  <!-- Eyes -->
  <rect fill="#333" x="10" y="8" width="4" height="2"/>
  <rect fill="#333" x="22" y="8" width="4" height="2"/>
  <!-- Legs -->
  <rect fill="#557" x="12" y="30" width="5" height="6"/>
  <rect fill="#557" x="19" y="30" width="5" height="6"/>
</svg>`);
      this._assets.set("projectile-arrow", `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="6" viewBox="0 0 20 6">
  <!-- Arrowhead -->
  <polygon fill="#654" points="0,3 15,0 20,3 15,6"/>
  <!-- Shaft -->
  <rect fill="#876" x="2" y="2" width="12" height="2"/>
  <!-- Fletching -->
  <polygon fill="#a98" points="2,0 6,2 2,4"/>
  <polygon fill="#a98" points="2,0 6,2 2,4" transform="scale(-1,1) translate(-20,0)"/>
</svg>`);
      this._assets.set("projectile-orb", `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <defs>
    <radialGradient id="orbg" cx="30%" cy="30%">
      <stop offset="0%" stop-color="#c8a0ff"/>
      <stop offset="100%" stop-color="#6040a0"/>
    </radialGradient>
  </defs>
  <!-- Main orb -->
  <circle fill="url(#orbg)" cx="8" cy="8" r="7"/>
  <!-- Highlight -->
  <circle fill="#e0c0ff" cx="5" cy="5" r="2"/>
  <!-- Inner glow -->
  <circle fill="#9060c0" cx="8" cy="8" r="4"/>
</svg>`);
      this._assets.set("ui-heart", `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path fill="#e44" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>`);
      this._assets.set("ui-coin", `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <!-- Outer ring -->
  <circle fill="#da0" cx="12" cy="12" r="10"/>
  <!-- Inner face -->
  <circle fill="#fb0" cx="12" cy="12" r="7"/>
  <!-- Center -->
  <circle fill="#da0" cx="12" cy="12" r="5"/>
  <!-- Dollar sign -->
  <text x="12" y="16" font-size="10" fill="#860" text-anchor="middle" font-weight="bold">$</text>
</svg>`);
    }
    /**
     * Load all assets - initializes embedded SVG assets
     * @returns {Promise<void>}
     */
    loadAll() {
      if (this._loaded) {
        return;
      }
      this._initializeAssets();
      this._loaded = true;
    }
    /**
     * Check if assets are loaded
     * @returns {boolean}
     */
    isLoaded() {
      return this._loaded;
    }
    /**
     * Get an asset by key
     * @param {string} key - Asset key
     * @returns {string|null} SVG string or null if not found or not loaded
     */
    get(key) {
      if (!this._loaded) {
        return null;
      }
      return this._assets.get(key) || null;
    }
    /**
     * Get all asset keys
     * @returns {string[]}
     */
    getKeys() {
      return [...ASSET_KEYS];
    }
  };

  // dist/temp-src/render/sprite-utils.js
  var _imageCache = /* @__PURE__ */ new Map();
  function drawImageSync(ctx, svgString, x, y, width, height) {
    const img = _imageCache.get(svgString);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
    } else {
      ctx.fillStyle = "#333";
      ctx.fillRect(x - width / 2, y - height / 2, width, height);
    }
  }
  function drawRotatedSync(ctx, svgString, x, y, width, height, angle) {
    const img = _imageCache.get(svgString);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#333";
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.restore();
    }
  }

  // dist/temp-src/render/canvas-renderer.js
  var WORLD_WIDTH = 960;
  var WORLD_HEIGHT = 540;
  var HEALTH_BAR_SHOW_DURATION = 1.5;
  var HEALTH_BAR_WIDTH = 30;
  var HEALTH_BAR_HEIGHT = 4;
  var TOWER_WIDTH = 50;
  var TOWER_HEIGHT = 60;
  var SLOT_WIDTH = 50;
  var SLOT_HEIGHT = 50;
  var ENEMY_WIDTH = 30;
  var ENEMY_HEIGHT = 30;
  var ARROW_WIDTH = 20;
  var ARROW_HEIGHT = 6;
  var ORB_WIDTH = 16;
  var ORB_HEIGHT = 16;
  var CanvasRenderer = class {
    /**
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     * @param {Object} [options]
     * @param {boolean} [options.reducedMotion=false] - When true, suppress
     *   effect scale wobble (spec §12); game speed is unaffected.
     */
    constructor(canvas, options) {
      this._canvas = canvas;
      this._ctx = canvas.getContext("2d");
      this._assetStore = new AssetStore();
      this._dpr = 1;
      this._cssWidth = WORLD_WIDTH;
      this._cssHeight = WORLD_HEIGHT;
      this._selectedTowerId = null;
      this._damageTimes = /* @__PURE__ */ new Map();
      this._reducedMotion = !!(options && options.reducedMotion);
    }
    /**
     * Get the asset store
     * @returns {AssetStore}
     */
    get assetStore() {
      return this._assetStore;
    }
    /**
     * Toggle reduced-motion rendering. False by default (full wobble).
     * Spec §12 says reduced motion must not change game speed.
     * @param {boolean} value
     */
    setReducedMotion(value) {
      this._reducedMotion = Boolean(value);
    }
    /**
     * Get/set selected tower ID (for range indicator)
     * @returns {string|null}
     */
    get selectedTowerId() {
      return this._selectedTowerId;
    }
    set selectedTowerId(value) {
      this._selectedTowerId = value;
    }
    /**
     * Resize the canvas for the given CSS dimensions and device pixel ratio
     * @param {number} cssWidth - CSS width in pixels
     * @param {number} cssHeight - CSS height in pixels
     * @param {number} dpr - Device pixel ratio
     */
    resize(cssWidth, cssHeight, dpr) {
      const cappedDpr = Math.min(dpr, 2);
      this._dpr = cappedDpr;
      this._cssWidth = cssWidth;
      this._cssHeight = cssHeight;
      const pixelWidth = Math.floor(cssWidth * cappedDpr);
      const pixelHeight = Math.floor(cssHeight * cappedDpr);
      if (this._canvas.width !== pixelWidth || this._canvas.height !== pixelHeight) {
        this._canvas.width = pixelWidth;
        this._canvas.height = pixelHeight;
      }
      this._ctx.setTransform(cappedDpr, 0, 0, cappedDpr, 0, 0);
    }
    /**
     * Render a game snapshot
     * @param {GameState} snapshot - The game state snapshot
     * @param {number} interpolation - Interpolation factor (0-1) for smooth rendering
     */
    render(snapshot, interpolation) {
      const ctx = this._ctx;
      ctx.clearRect(0, 0, this._cssWidth, this._cssHeight);
      this._renderBackground();
      this._renderPath(snapshot.path);
      this._renderTowerSlots(snapshot.towerSlots);
      this._renderTowers(snapshot.towers, snapshot.path);
      this._renderEnemies(snapshot.enemies, snapshot.path, snapshot.towers, interpolation);
      this._renderProjectiles(snapshot.projectiles);
      this._renderEffects(snapshot.effects);
      if (this._selectedTowerId) {
        this._renderRangeIndicator(snapshot.towers);
      }
    }
    /**
     * Render background
     */
    _renderBackground() {
      const ctx = this._ctx;
      const svg = this._assetStore.get("map-background");
      if (svg) {
        drawImageSync(ctx, svg, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT);
      } else {
        ctx.fillStyle = "#4a7c4e";
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }
    }
    /**
     * Render path/road
     * @param {PathModel} path - The path model
     */
    _renderPath(path) {
      if (!path) return;
      const ctx = this._ctx;
      ctx.strokeStyle = "#8b7355";
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const segments = path.segments;
      if (segments.length > 0) {
        ctx.moveTo(segments[0].start.x, segments[0].start.y);
        for (const seg of segments) {
          ctx.lineTo(seg.end.x, seg.end.y);
        }
      }
      ctx.stroke();
      ctx.strokeStyle = "#6b5335";
      ctx.lineWidth = 44;
      ctx.globalCompositeOperation = "destination-over";
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      const castleSvg = this._assetStore.get("castle");
      const lastSeg = segments[segments.length - 1];
      if (castleSvg) {
        drawImageSync(ctx, castleSvg, lastSeg.end.x, lastSeg.end.y - 20, 80, 80);
      }
    }
    /**
     * Render empty tower slots
     * @param {TowerSlot[]} towerSlots - Tower slots from game state
     */
    _renderTowerSlots(towerSlots) {
      if (!towerSlots) return;
      const ctx = this._ctx;
      const slotSvg = this._assetStore.get("tower-slot");
      for (const slot of towerSlots) {
        if (slot.towerId === null) {
          if (slotSvg) {
            drawImageSync(ctx, slotSvg, slot.x, slot.y, SLOT_WIDTH, SLOT_HEIGHT);
          } else {
            ctx.fillStyle = "#6b5b4f";
            ctx.beginPath();
            ctx.ellipse(slot.x, slot.y + 5, 22, 10, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    /**
     * Render towers
     * @param {Tower[]} towers - Towers from game state
     * @param {PathModel} path - The path model
     */
    _renderTowers(towers, path) {
      if (!towers) return;
      const ctx = this._ctx;
      for (const tower of towers) {
        if (!tower.alive) continue;
        const key = tower.type === "archer" ? "tower-archer" : "tower-mage";
        const svg = this._assetStore.get(key);
        if (svg) {
          drawImageSync(ctx, svg, tower.x, tower.y, TOWER_WIDTH, TOWER_HEIGHT);
        } else {
          ctx.fillStyle = tower.type === "archer" ? "#7a6b5a" : "#5a4a6a";
          ctx.fillRect(tower.x - 15, tower.y - 20, 30, 40);
        }
      }
    }
    /**
     * Render enemies
     * @param {Enemy[]} enemies - Enemies from game state
     * @param {PathModel} path - The path model
     * @param {Tower[]} towers - Towers for targeted check
     * @param {number} interpolation - Interpolation factor
     */
    _renderEnemies(enemies, path, towers, interpolation) {
      if (!enemies || !path) return;
      const ctx = this._ctx;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const pos = samplePath(path, enemy.distance);
        let svg;
        let width = ENEMY_WIDTH;
        let height = ENEMY_HEIGHT;
        switch (enemy.type) {
          case "soldier":
            svg = this._assetStore.get("enemy-soldier");
            break;
          case "scout":
            svg = this._assetStore.get("enemy-scout");
            width = 24;
            height = 24;
            break;
          case "armored":
            svg = this._assetStore.get("enemy-armored");
            width = 36;
            height = 36;
            break;
          default:
            svg = null;
        }
        if (svg) {
          drawRotatedSync(ctx, svg, pos.x, pos.y, width, height, pos.angle);
        } else {
          ctx.fillStyle = "#c44";
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
          ctx.fill();
        }
        const isTargeted = this._selectedTowerId && towers?.some((t) => t.alive && t.id === this._selectedTowerId);
        const damageKey = enemy.id;
        if (enemy.hp < enemy.maxHp) {
          this._damageTimes.set(damageKey, Date.now());
        }
        const lastDamageTime = this._damageTimes.get(damageKey);
        const timeSinceDamage = lastDamageTime ? (Date.now() - lastDamageTime) / 1e3 : Infinity;
        const showHealthBar = enemy.hp < enemy.maxHp || isTargeted && timeSinceDamage < HEALTH_BAR_SHOW_DURATION;
        const shouldHideHealthBar = enemy.hp >= enemy.maxHp && timeSinceDamage >= HEALTH_BAR_SHOW_DURATION && !isTargeted;
        if (shouldHideHealthBar) {
          this._damageTimes.delete(damageKey);
        }
        if (showHealthBar) {
          this._renderHealthBar(ctx, pos.x, pos.y - height / 2 - 8, enemy.hp, enemy.maxHp);
        }
      }
    }
    /**
     * Render a health bar above an enemy
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x - Center X
     * @param {number} y - Y position
     * @param {number} hp - Current HP
     * @param {number} maxHp - Max HP
     */
    _renderHealthBar(ctx, x, y, hp, maxHp) {
      const ratio = hp / maxHp;
      ctx.fillStyle = "#400";
      ctx.fillRect(x - HEALTH_BAR_WIDTH / 2, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
      ctx.fillStyle = ratio > 0.5 ? "#4a4" : ratio > 0.25 ? "#aa4" : "#a44";
      ctx.fillRect(x - HEALTH_BAR_WIDTH / 2, y, HEALTH_BAR_WIDTH * ratio, HEALTH_BAR_HEIGHT);
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - HEALTH_BAR_WIDTH / 2, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
    }
    /**
     * Render projectiles
     * @param {Projectile[]} projectiles - Projectiles from game state
     */
    _renderProjectiles(projectiles) {
      if (!projectiles) return;
      const ctx = this._ctx;
      for (const proj of projectiles) {
        if (!proj.alive) continue;
        const dx = proj.x - (proj.lastKnownPos?.x || proj.x);
        const dy = proj.y - (proj.lastKnownPos?.y || proj.y);
        const angle = Math.atan2(dy, dx);
        let svg;
        let width, height;
        if (proj.damageType === "magic") {
          svg = this._assetStore.get("projectile-orb");
          width = ORB_WIDTH;
          height = ORB_HEIGHT;
        } else {
          svg = this._assetStore.get("projectile-arrow");
          width = ARROW_WIDTH;
          height = ARROW_HEIGHT;
        }
        if (svg) {
          drawRotatedSync(ctx, svg, proj.x, proj.y, width, height, angle);
        } else {
          ctx.fillStyle = proj.damageType === "magic" ? "#7a5a" : "#654";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    /**
     * Render effects (death puffs, hit sparks)
     * @param {Effect[]} effects - Effects from game state
     */
    _renderEffects(effects) {
      if (!effects) return;
      const ctx = this._ctx;
      for (const effect of effects) {
        if (!effect.alive) continue;
        const wobble = this._reducedMotion ? 1 : getEffectScale(effect);
        const alpha = getEffectAlpha(effect);
        let color;
        switch (effect.type) {
          case EffectType.DEATH_PUFF:
            color = `rgba(200, 180, 160, ${alpha})`;
            break;
          case EffectType.HIT_SPARK:
            color = `rgba(255, 220, 100, ${alpha})`;
            break;
          default:
            color = `rgba(128, 128, 128, ${alpha})`;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        const baseSize = 15;
        ctx.arc(effect.x, effect.y, baseSize * wobble, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    /**
     * Render range indicator for selected tower
     * @param {Tower[]} towers - Towers from game state
     */
    _renderRangeIndicator(towers) {
      if (!towers) return;
      const ctx = this._ctx;
      const tower = towers.find((t) => t.id === this._selectedTowerId);
      if (!tower || !tower.alive) return;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  // dist/temp-src/input/pointer-controller.js
  var PointerController = class {
    /**
     * @param {HTMLCanvasElement} canvas - Game canvas element
     * @param {WorldSize} worldSize - World dimensions (e.g., {width: 960, height: 540})
     * @param {function(string): void} onTowerSlotClick - Callback with slot ID when tower slot is clicked
     */
    constructor(canvas, worldSize, onTowerSlotClick) {
      this._canvas = canvas;
      this._worldSize = worldSize;
      this._onTowerSlotClick = onTowerSlotClick;
      this._pointerDownPos = null;
      this._pointerDownTarget = null;
      this._moveThreshold = 5;
      this._supportedEvents = /* @__PURE__ */ new Set(["pointerdown", "pointerup", "pointercancel", "keydown"]);
      this._bindEvents();
    }
    _bindEvents() {
      this._canvas.addEventListener("pointerdown", this._handlePointerDown.bind(this));
      this._canvas.addEventListener("pointerup", this._handlePointerUp.bind(this));
      this._canvas.addEventListener("pointercancel", this._handlePointerCancel.bind(this));
      this._canvas.addEventListener("keydown", this._handleKeyDown.bind(this));
      this._canvas.tabIndex = 0;
    }
    /**
     * @param {PointerEvent} event
     */
    _handlePointerDown(event) {
      if (event.button !== 0 && event.pointerType === "mouse") {
        return;
      }
      this._pointerDownPos = { x: event.clientX, y: event.clientY };
      this._pointerDownTarget = event.pointerId;
      event.preventDefault();
    }
    /**
     * @param {PointerEvent} event
     */
    _handlePointerUp(event) {
      if (this._pointerDownTarget !== event.pointerId) {
        return;
      }
      if (this._pointerDownPos) {
        const dx = event.clientX - this._pointerDownPos.x;
        const dy = event.clientY - this._pointerDownPos.y;
        const distance2 = Math.sqrt(dx * dx + dy * dy);
        if (distance2 > this._moveThreshold) {
          this._resetPointerState();
          return;
        }
      }
      const canvasRect = this._canvas.getBoundingClientRect();
      const worldPos = clientToWorld(event.clientX, event.clientY, canvasRect, this._worldSize);
      if (this._onTowerSlotClick) {
        this._onTowerSlotClick(worldPos);
      }
      this._resetPointerState();
    }
    /**
     * @param {PointerEvent} event
     */
    _handlePointerCancel(event) {
      this._resetPointerState();
    }
    /**
     * @param {KeyboardEvent} event
     */
    _handleKeyDown(event) {
      if (event.key === "Escape") {
        const closeEvent = new CustomEvent("escape-pressed", {
          bubbles: true,
          composed: true,
          detail: { source: "pointer-controller" }
        });
        this._canvas.dispatchEvent(closeEvent);
      }
    }
    _resetPointerState() {
      this._pointerDownPos = null;
      this._pointerDownTarget = null;
    }
    /**
     * Cleanup event listeners
     */
    destroy() {
      this._canvas.removeEventListener("pointerdown", this._handlePointerDown);
      this._canvas.removeEventListener("pointerup", this._handlePointerUp);
      this._canvas.removeEventListener("pointercancel", this._handlePointerCancel);
      this._canvas.removeEventListener("keydown", this._handleKeyDown);
      this._onTowerSlotClick = null;
    }
  };

  // dist/temp-src/mini-tower-defense-element.js
  var ATTRIBUTES = {
    WIDTH: "width",
    HEIGHT: "height",
    LOCALE: "locale",
    AUTO_START: "auto-start",
    MUTED: "muted"
  };
  var DEFAULT_WIDTH = 960;
  var DEFAULT_HEIGHT = 540;
  var DEFAULT_LOCALE = "zh-CN";
  var MiniTowerDefense = class extends HTMLElement {
    static get observedAttributes() {
      return [
        ATTRIBUTES.WIDTH,
        ATTRIBUTES.HEIGHT,
        ATTRIBUTES.LOCALE,
        ATTRIBUTES.AUTO_START,
        ATTRIBUTES.MUTED
      ];
    }
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._state = "idle";
      this._hud = null;
      this._buildMenu = null;
      this._modal = null;
      this._muted = false;
      this._locale = DEFAULT_LOCALE;
      this._audio = new AudioManager((detail) => this._reportAudioError(detail));
      this._audioBroken = false;
      this._reducedMotion = this._readReducedMotion();
      this._engine = null;
      this._gameLoop = null;
      this._renderer = null;
      this._pointerController = null;
      this._path = null;
      this._canvas = null;
      this._resizeObserver = null;
      this._autoPaused = false;
      this._gameSnapshot = {
        state: "idle",
        lives: PLAYER_CONFIG.initialLives,
        gold: PLAYER_CONFIG.initialGold,
        wave: 0,
        totalWaves,
        towers: [],
        enemies: [],
        projectiles: [],
        effects: [],
        towerSlots: [],
        elapsedMs: 0,
        totalKillRewardGold: 0
      };
      this._initShadowDOM();
    }
    /**
     * Read the prefers-reduced-motion media query. Defaults to false when
     * matchMedia isn't available (server-side, very old browsers).
     * @returns {boolean}
     */
    _readReducedMotion() {
      if (typeof window === "undefined" || !window.matchMedia) return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    /** Forward an audio error to a game-error event per spec §7.3. */
    _reportAudioError(detail) {
      this._audioBroken = true;
      this._dispatchEvent("game-error", detail);
    }
    _initShadowDOM() {
      const styleEl = document.createElement("style");
      styleEl.textContent = getStyles();
      this.shadowRoot.appendChild(styleEl);
      const templateDiv = document.createElement("div");
      templateDiv.innerHTML = getTemplate();
      this.shadowRoot.appendChild(templateDiv);
      this._canvas = this.shadowRoot.querySelector("canvas");
      this._path = createPath(PATH_POINTS);
      const i18n = getI18n(this._locale);
      this._hud = new HUDController(this.shadowRoot, i18n, getI18n);
      this._buildMenu = new BuildMenuController(this.shadowRoot, i18n, () => this.getSnapshot());
      this._modal = new ModalController(this.shadowRoot, i18n);
      this._hud.onSoundClick(() => {
        this._audio.unlock();
        this.muted = !this.muted;
      });
      this._hud.onPauseClick(() => {
        if (this._state === "running") this.pause();
        else if (this._state === "paused") {
          if (this._autoPaused) this._autoPaused = false;
          this.resume();
        }
      });
      this._buildMenu.onBuildArcher((slotId) => {
        const slotIndex = parseInt(slotId.split("-").pop(), 10);
        this._handleBuildTower(slotIndex, TowerType.ARCHER);
      });
      this._buildMenu.onBuildMage((slotId) => {
        const slotIndex = parseInt(slotId.split("-").pop(), 10);
        this._handleBuildTower(slotIndex, TowerType.MAGE);
      });
      this._buildMenu.onSell((slotId) => {
        const slotIndex = parseInt(slotId.split("-").pop(), 10);
        this._handleSellTower(slotIndex);
      });
      this._modal.onResume(() => {
        this._autoPaused = false;
        this.resume();
      });
      this._modal.onRestart(() => this.restart());
      this.shadowRoot.addEventListener("escape-pressed", () => {
        this._buildMenu.hide();
      });
    }
    /**
     * Dispatch a CustomEvent with bubbles+composed (spec §3.5).
     * @param {string} type
     * @param {Object} detail
     */
    _dispatchEvent(type, detail) {
      this.dispatchEvent(
        new CustomEvent(type, {
          bubbles: true,
          composed: true,
          detail
        })
      );
    }
    // ─── Attribute getters/setters ─────────────────────────────────────────────
    get width() {
      return parseInt(this.getAttribute(ATTRIBUTES.WIDTH) || DEFAULT_WIDTH, 10);
    }
    set width(value) {
      this.setAttribute(ATTRIBUTES.WIDTH, value);
    }
    get height() {
      return parseInt(this.getAttribute(ATTRIBUTES.HEIGHT) || DEFAULT_HEIGHT, 10);
    }
    set height(value) {
      this.setAttribute(ATTRIBUTES.HEIGHT, value);
    }
    get locale() {
      return this.getAttribute(ATTRIBUTES.LOCALE) || DEFAULT_LOCALE;
    }
    set locale(value) {
      this.setAttribute(ATTRIBUTES.LOCALE, value);
    }
    get autoStart() {
      return this.hasAttribute(ATTRIBUTES.AUTO_START);
    }
    set autoStart(value) {
      if (value) this.setAttribute(ATTRIBUTES.AUTO_START, "");
      else this.removeAttribute(ATTRIBUTES.AUTO_START);
    }
    get muted() {
      return this._muted;
    }
    set muted(value) {
      this._muted = Boolean(value);
      if (this._audio) this._audio.setMuted(this._muted);
      if (this._hud) this._hud.setMuted(this._muted);
      if (value) this.setAttribute(ATTRIBUTES.MUTED, "");
      else this.removeAttribute(ATTRIBUTES.MUTED);
    }
    get state() {
      return this._state;
    }
    get paused() {
      return this._state === "paused";
    }
    set paused(value) {
      if (value) this.pause();
      else this.resume();
    }
    // ─── Lifecycle ─────────────────────────────────────────────────────────────
    _initGameEngine() {
      if (this._engine) return;
      this._engine = new GameEngine();
    }
    /**
     * Recompute CSS size from the host element and apply to renderer.
     * Called by the ResizeObserver and once at construction.
     */
    _applyResize() {
      if (!this._canvas || !this._renderer) return;
      const rect = this.getBoundingClientRect();
      const cssWidth = Math.max(1, Math.floor(rect.width));
      const cssHeight = Math.max(1, Math.floor(rect.height));
      const dpr = typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1;
      this._renderer.resize(cssWidth, cssHeight, dpr);
    }
    _startGameLoop() {
      if (this._gameLoop) return;
      const now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
      const requestFrame = (cb) => requestAnimationFrame(cb);
      const cancelFrame = (id) => cancelAnimationFrame(id);
      this._gameLoop = createGameLoop({
        update: (delta) => this._update(delta),
        render: (interp) => this._render(interp),
        now,
        requestFrame,
        cancelFrame
      });
      this._gameLoop.start();
    }
    /**
     * One fixed-timestep game update.
     * Translates engine events into spec-shaped (§3.5) public events.
     * @param {number} deltaSeconds
     */
    _update(deltaSeconds) {
      if (!this._engine || !this._path) return;
      const snapshot = this._engine.getSnapshot();
      const enemies = [...snapshot.enemies];
      const result = this._engine.tick(deltaSeconds, enemies, this._path);
      for (const event of result.events) {
        this._handleEngineEvent(event);
      }
      const updatedEnemies = result.enemies.filter((e) => e.alive);
      const engineSnapshot = this._engine.getSnapshot();
      this.updateSnapshot({
        ...engineSnapshot,
        enemies: updatedEnemies,
        path: this._path,
        towerSlots: this._engine.towerSlots
      });
    }
    /**
     * Translate engine-internal events into spec-shaped public events.
     * §3.5 detail tables are matched exactly here.
     * @param {Object} event
     */
    _handleEngineEvent(event) {
      switch (event.type) {
        case "wave-start": {
          this._safePlay("wave-start");
          this._dispatchEvent("wave-start", {
            wave: event.wave,
            totalWaves
          });
          this.showAnnouncement(`Wave ${event.wave}`);
          break;
        }
        case "wave-complete": {
          const snap = this._engine.getSnapshot();
          this._dispatchEvent("wave-complete", {
            wave: event.wave,
            remainingLives: snap.lives,
            gold: snap.gold
          });
          break;
        }
        case "tower-attack":
          break;
        case "projectile-hit":
          this._safePlay("hit");
          break;
        case "enemy-leak": {
          this._safePlay("enemy-leak");
          this._dispatchEvent("enemy-leaked", {
            enemyType: event.enemyType,
            damage: event.damage,
            remainingLives: event.livesRemaining
          });
          break;
        }
        case "game-win": {
          this._safePlay("victory");
          const snap = this._engine.getSnapshot();
          const score = this._computeScoreSnapshot(snap, "win");
          this._dispatchEvent("game-win", {
            elapsedMs: snap.elapsedMs,
            remainingLives: snap.lives,
            gold: snap.gold,
            score
          });
          break;
        }
        case "game-lose": {
          this._safePlay("defeat");
          const snap = this._engine.getSnapshot();
          const score = this._computeScoreSnapshot(snap, "lose");
          this._dispatchEvent("game-lose", {
            elapsedMs: snap.elapsedMs,
            completedWave: snap.wave,
            score
          });
          break;
        }
      }
    }
    /**
     * Convenience: compute the score breakdown for the current snapshot.
     * @param {GameSnapshot} snap
     * @param {'win'|'lose'} outcome
     */
    _computeScoreSnapshot(snap, outcome) {
      return calculateScore2({
        outcome,
        totalKillRewardGold: snap.totalKillRewardGold || 0,
        lives: snap.lives || 0,
        elapsedMs: snap.elapsedMs || 0,
        completedWave: snap.wave || 0
      });
    }
    /** Play a sound only when audio is healthy. */
    _safePlay(name) {
      if (this._audioBroken) return;
      if (this._audio && !this._audio.muted) this._audio.play(name);
    }
    /**
     * Render the canvas. Lazily creates the renderer on first call so SSR /
     * test environments without a 2D context still work.
     * @param {number} interpolation
     */
    _render(interpolation) {
      if (!this._gameSnapshot) return;
      if (!this._renderer && this._canvas) {
        try {
          const ctx = this._canvas.getContext("2d");
          if (!ctx) return;
          this._renderer = new CanvasRenderer(this._canvas, {
            reducedMotion: this._reducedMotion
          });
          this._applyResize();
          this._renderer.assetStore.loadAll();
        } catch (e) {
          return;
        }
      } else if (this._renderer) {
        this._renderer.setReducedMotion(this._reducedMotion);
      }
      if (!this._renderer) return;
      try {
        const renderSnapshot = {
          ...this._gameSnapshot,
          path: this._path,
          towerSlots: this._engine ? this._engine.towerSlots : []
        };
        this._renderer.render(renderSnapshot, interpolation);
      } catch (error) {
        this._dispatchEvent("game-error", {
          code: "RENDER_ERROR",
          message: error.message
        });
        this.pause();
      }
    }
    // ─── Public API ────────────────────────────────────────────────────────────
    /**
     * Start (or restart-from-idle) the game.
     */
    start() {
      if (this._state === "destroyed") return;
      this._initGameEngine();
      this._startGameLoop();
      this._wireResizeAndVisibility();
      const result = this._engine.start();
      for (const event of result.events) {
        if (event.type === "game-start") {
          this._dispatchEvent("game-start", { wave: 1 });
        }
      }
      if (!this._pointerController && this._canvas) {
        this._pointerController = new PointerController(
          this._canvas,
          { width: 960, height: 540 },
          (worldPos) => this._handleTowerSlotClick(worldPos)
        );
      }
      this._state = "running";
      this._gameSnapshot.state = "running";
      this._autoPaused = false;
      this._safePlay("wave-start");
    }
    /**
     * Pause a running game.
     */
    pause() {
      if (this._state !== "running") return;
      this._state = "paused";
      this._gameSnapshot.state = "paused";
      if (this._gameLoop) this._gameLoop.pause();
      if (this._hud) this._hud.setPaused(true);
      if (this._modal && !this._autoPaused) {
        this._modal.showPaused();
      }
      if (this._autoPaused && this._modal) {
        this._modal.showPaused();
      }
      const elapsedMs = this._engine ? this._engine.getSnapshot().elapsedMs : 0;
      this._dispatchEvent("game-pause", { elapsedMs });
    }
    /**
     * Resume a paused game.
     */
    resume() {
      if (this._state !== "paused") return;
      this._state = "running";
      this._gameSnapshot.state = "running";
      this._autoPaused = false;
      if (this._gameLoop) this._gameLoop.resume();
      if (this._hud) this._hud.setPaused(false);
      if (this._modal) this._modal.hide();
      const elapsedMs = this._engine ? this._engine.getSnapshot().elapsedMs : 0;
      this._dispatchEvent("game-resume", { elapsedMs });
    }
    /**
     * Restart the game from scratch.
     * Per spec, the user expects the element to be back in 'running', not
     * idle, after restart (previous behavior returned to idle and left the
     * game paused — confusing UX). This call resets state and immediately
     * re-enters the running state.
     */
    restart() {
      if (this._state === "destroyed") return;
      if (this._gameLoop) {
        this._gameLoop.stop();
        this._gameLoop = null;
      }
      if (this._engine) this._engine.reset();
      this._gameSnapshot = {
        state: "idle",
        lives: PLAYER_CONFIG.initialLives,
        gold: PLAYER_CONFIG.initialGold,
        wave: 0,
        totalWaves,
        towers: [],
        enemies: [],
        projectiles: [],
        effects: [],
        towerSlots: this._engine ? this._engine.towerSlots : [],
        elapsedMs: 0,
        totalKillRewardGold: 0
      };
      if (this._modal) this._modal.hide();
      if (this._buildMenu) this._buildMenu.hide();
      if (this._hud) this._hud.update(this._gameSnapshot);
      this.start();
    }
    /**
     * Destroy the component. Stops RAF, releases audio, tears down observers.
     */
    destroy() {
      this._state = "destroyed";
      this._gameSnapshot.state = "destroyed";
      if (this._gameLoop) {
        this._gameLoop.stop();
        this._gameLoop = null;
      }
      if (this._audio) {
        this._audio.destroy();
        this._audio = null;
      }
      if (this._hud) {
        this._hud.destroy();
        this._hud = null;
      }
      if (this._buildMenu) {
        this._buildMenu.destroy();
        this._buildMenu = null;
      }
      if (this._modal) {
        this._modal.destroy();
        this._modal = null;
      }
      if (this._pointerController) {
        this._pointerController.destroy();
        this._pointerController = null;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
      if (this._visibilityHandler && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", this._visibilityHandler);
        this._visibilityHandler = null;
      }
      this._renderer = null;
      this._engine = null;
    }
    /**
     * Update the internal snapshot. The engine can call this; UI handlers can
     * also call it for synthetic state transitions.
     * @param {Object} snapshot
     */
    updateSnapshot(snapshot) {
      const prevState = this._gameSnapshot.state;
      const prevWave = this._gameSnapshot.wave;
      this._gameSnapshot = {
        ...this._gameSnapshot,
        ...snapshot,
        towerSlots: snapshot.towerSlots || this._gameSnapshot.towerSlots,
        enemies: snapshot.enemies || this._gameSnapshot.enemies,
        projectiles: snapshot.projectiles || this._gameSnapshot.projectiles,
        effects: snapshot.effects || this._gameSnapshot.effects
      };
      if (this._gameSnapshot.state === "won" && prevState !== "won") {
        if (this._modal) this._modal.showVictory(this._gameSnapshot);
        this._safePlay("victory");
        this._dispatchEvent("game-win", {
          elapsedMs: this._gameSnapshot.elapsedMs || 0,
          remainingLives: this._gameSnapshot.lives || 0,
          gold: this._gameSnapshot.gold || 0,
          score: this._computeScoreSnapshot(this._gameSnapshot, "win").winScore
        });
      } else if (this._gameSnapshot.state === "lost" && prevState !== "lost") {
        if (this._modal) this._modal.showDefeat(this._gameSnapshot);
        this._safePlay("defeat");
        this._dispatchEvent("game-lose", {
          elapsedMs: this._gameSnapshot.elapsedMs || 0,
          completedWave: this._gameSnapshot.wave || 0,
          score: this._computeScoreSnapshot(this._gameSnapshot, "lose").loseScore
        });
      }
      this._updateHUD(this._gameSnapshot);
    }
    /** @returns {Readonly<GameSnapshot>} */
    getSnapshot() {
      return Object.freeze({ ...this._gameSnapshot });
    }
    _updateHUD(snapshot) {
      if (this._hud) this._hud.update(snapshot);
      if (this._buildMenu && this._buildMenu.isShowing()) this._buildMenu.update();
    }
    /**
     * Show a transient announcement in the aria-live region.
     * @param {string} text
     */
    showAnnouncement(text) {
      const node = this.shadowRoot?.querySelector(".announcement");
      if (!node) return;
      node.textContent = text;
      node.classList.add("visible");
      setTimeout(() => {
        node.classList.remove("visible");
      }, 2e3);
    }
    /** Allow tests to inject a PointerController implementation. */
    setPointerController(controller) {
      this._pointerController = controller;
    }
    _handleTowerSlotClick(worldPos) {
      const slots = TOWER_SLOTS.map((pos, index) => ({
        id: `tower-slot-${index}`,
        x: pos.x,
        y: pos.y
      }));
      const hitSlot = hitTestTowerSlot(worldPos, slots, 35);
      if (!hitSlot) {
        this._buildMenu.hide();
        return;
      }
      if (this._buildMenu.isShowing() && this._buildMenu._currentSlotId === hitSlot.id) {
        this._buildMenu.hide();
      } else {
        this._buildMenu.show(hitSlot.id, { x: hitSlot.x, y: hitSlot.y });
      }
    }
    _handleBuildTower(slotIndex, towerType) {
      if (!this._engine) return;
      const result = this._engine.buildTower(slotIndex, towerType);
      if (!result.ok) return;
      const snap = result.snapshot;
      const tower = snap.towers.find((t) => t.slotId === slotIndex);
      this.updateSnapshot({
        ...this._gameSnapshot,
        gold: snap.gold,
        towers: snap.towers
      });
      this._buildMenu.hide();
      this._safePlay("build");
      if (tower) {
        this._dispatchEvent("tower-built", {
          slotId: `tower-slot-${slotIndex}`,
          towerType,
          cost: tower.cost,
          gold: snap.gold
        });
      }
    }
    _handleSellTower(slotIndex) {
      if (!this._engine) return;
      const result = this._engine.sellTower(slotIndex);
      if (!result.ok) return;
      const snap = result.snapshot;
      this.updateSnapshot({
        ...this._gameSnapshot,
        gold: snap.gold,
        towers: snap.towers
      });
      this._buildMenu.hide();
      this._safePlay("sell");
      this._dispatchEvent("tower-sold", {
        slotId: `tower-slot-${slotIndex}`,
        towerType: snap.towers.length === 0 ? "" : "",
        // tower no longer in state
        refund: result.refund,
        gold: snap.gold
      });
    }
    // ─── ResizeObserver + visibilitychange (spec §5.4, §13) ───────────────────
    _wireResizeAndVisibility() {
      if (typeof ResizeObserver !== "undefined" && !this._resizeObserver && typeof this.getBoundingClientRect === "function") {
        this._resizeObserver = new ResizeObserver(() => this._applyResize());
        this._resizeObserver.observe(this);
      }
      if (typeof document !== "undefined" && !this._visibilityHandler) {
        this._visibilityHandler = () => this._handleVisibilityChange();
        document.addEventListener("visibilitychange", this._visibilityHandler);
      }
    }
    /**
     * Spec §13: when the element is hidden, auto-pause and keep the player
     * paused on return until they explicitly resume.
     */
    _handleVisibilityChange() {
      if (typeof document === "undefined") return;
      if (document.hidden && this._state === "running") {
        this._autoPaused = true;
        this.pause();
      }
    }
    // ─── Web Component lifecycle ──────────────────────────────────────────────
    connectedCallback() {
      if (this.autoStart) this.start();
    }
    disconnectedCallback() {
      this.destroy();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      switch (name) {
        case ATTRIBUTES.LOCALE:
          this._locale = newValue || DEFAULT_LOCALE;
          if (this._hud) this._hud.setLocale(this._locale);
          break;
        case ATTRIBUTES.MUTED:
          this._muted = this.hasAttribute(ATTRIBUTES.MUTED);
          if (this._hud) this._hud.setMuted(this._muted);
          break;
        default:
          break;
      }
    }
  };
  if (!customElements.get("mini-tower-defense")) {
    customElements.define("mini-tower-defense", MiniTowerDefense);
  }
  var mini_tower_defense_element_default = MiniTowerDefense;
})();
