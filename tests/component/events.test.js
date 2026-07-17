import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/mini-tower-defense-element.js';

describe('mini-tower-defense events', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('mini-tower-defense');
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  describe('Build Menu', () => {
    it('build menu element exists and is hidden initially', () => {
      const buildMenu = element.shadowRoot.querySelector('.build-menu');
      expect(buildMenu).toBeTruthy();
      expect(buildMenu.hasAttribute('hidden')).toBe(true);
    });

    it('has archer and mage tower cards in build menu', () => {
      const archerCard = element.shadowRoot.querySelector('.tower-card-archer');
      const mageCard = element.shadowRoot.querySelector('.tower-card-mage');
      const sellCard = element.shadowRoot.querySelector('.tower-card-sell');

      expect(archerCard).toBeTruthy();
      expect(mageCard).toBeTruthy();
      expect(sellCard).toBeTruthy();
    });

    it('archer card shows correct cost (60 gold)', () => {
      const archerCost = element.shadowRoot.querySelector('.archer-cost');
      expect(archerCost.textContent).toBe('60');
    });

    it('mage card shows correct cost (90 gold)', () => {
      const mageCost = element.shadowRoot.querySelector('.mage-cost');
      expect(mageCost.textContent).toBe('90');
    });

    it('build menu shows archer and mage cards by default when displayed', () => {
      // Access build menu controller through the component
      const archerCard = element.shadowRoot.querySelector('.tower-card-archer');
      const mageCard = element.shadowRoot.querySelector('.tower-card-mage');
      const sellCard = element.shadowRoot.querySelector('.tower-card-sell');

      // Archer and mage should not be hidden initially
      expect(archerCard.hidden).toBe(false);
      expect(mageCard.hidden).toBe(false);
      // Sell card should be hidden initially
      expect(sellCard.hidden).toBe(true);
    });
  });

  describe('Modal', () => {
    it('modal element exists and is hidden initially', () => {
      const modal = element.shadowRoot.querySelector('.modal');
      expect(modal).toBeTruthy();
      expect(modal.hasAttribute('hidden')).toBe(true);
    });

    it('modal has correct ARIA attributes', () => {
      const modal = element.shadowRoot.querySelector('.modal');
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
    });

    it('modal has title, body, and buttons', () => {
      const title = element.shadowRoot.querySelector('.modal-title');
      const body = element.shadowRoot.querySelector('.modal-body');
      const resumeBtn = element.shadowRoot.querySelector('.modal-resume-button');
      const restartBtn = element.shadowRoot.querySelector('.modal-restart-button');

      expect(title).toBeTruthy();
      expect(body).toBeTruthy();
      expect(resumeBtn).toBeTruthy();
      expect(restartBtn).toBeTruthy();
    });
  });

  describe('Announcement', () => {
    it('announcement element exists', () => {
      const announcement = element.shadowRoot.querySelector('.announcement');
      expect(announcement).toBeTruthy();
      expect(announcement.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('showAnnouncement method', () => {
    it('shows announcement text and hides after delay', async () => {
      element.showAnnouncement('Wave 1');

      const announcement = element.shadowRoot.querySelector('.announcement');
      expect(announcement.textContent).toBe('Wave 1');
      expect(announcement.classList.contains('visible')).toBe(true);

      // Wait for announcement to hide
      await new Promise(resolve => setTimeout(resolve, 2100));
      expect(announcement.classList.contains('visible')).toBe(false);
    });
  });

  describe('getSnapshot', () => {
    it('returns current game state snapshot', () => {
      const snapshot = element.getSnapshot();
      expect(snapshot).toBeTruthy();
      expect(snapshot.state).toBe('idle');
      expect(snapshot.gold).toBe(140);
      expect(snapshot.lives).toBe(10);
      expect(snapshot.wave).toBe(0);
    });

    it('returns frozen snapshot (immutable)', () => {
      const snapshot = element.getSnapshot();
      expect(Object.isFrozen(snapshot)).toBe(true);
    });
  });

  describe('game events', () => {
    it('dispatches game-start event when start() is called', () => {
      let eventDispatched = false;
      let eventType = '';
      element.addEventListener('game-start', (e) => {
        eventDispatched = true;
        eventType = e.type;
      });

      element.start();
      expect(eventDispatched).toBe(true);
      expect(element.state).toBe('running');
    });

    it('game-start event has correct detail shape', () => {
      let eventDetail = null;
      element.addEventListener('game-start', (e) => {
        eventDetail = e.detail;
      });

      element.start();
      expect(eventDetail).toEqual({ wave: 1 });
    });

    it('updateSnapshot updates internal state', () => {
      element.updateSnapshot({
        state: 'running',
        lives: 8,
        gold: 120,
        wave: 1,
        totalWaves: 5,
        towers: []
      });

      const snapshot = element.getSnapshot();
      expect(snapshot.state).toBe('running');
      expect(snapshot.lives).toBe(8);
      expect(snapshot.gold).toBe(120);
      expect(snapshot.wave).toBe(1);
    });

    it('pause() transitions state to paused', () => {
      element.start();
      expect(element.state).toBe('running');

      element.pause();
      expect(element.state).toBe('paused');
    });

    it('resume() transitions state back to running', () => {
      element.start();
      element.pause();
      expect(element.state).toBe('paused');

      element.resume();
      expect(element.state).toBe('running');
    });

    it('restart() resets state and keeps game running', () => {
      element.start();
      element.updateSnapshot({
        state: 'running',
        lives: 5,
        gold: 80,
        wave: 2,
        totalWaves: 5,
        towers: []
      });

      element.restart();

      const snapshot = element.getSnapshot();
      // Per spec §13: restart resets state and re-enters running immediately.
      expect(snapshot.state).toBe('running');
      expect(snapshot.lives).toBe(10);
      expect(snapshot.gold).toBe(140);
      expect(snapshot.wave).toBe(0);
      expect(element.state).toBe('running');
    });
  });

  describe('state transitions with modals', () => {
    it('shows paused modal when pause() is called during running state', () => {
      element.start();
      element.pause();

      const modal = element.shadowRoot.querySelector('.modal');
      expect(modal.hasAttribute('hidden')).toBe(false);
    });

    it('shows victory modal when state transitions to won', () => {
      element.updateSnapshot({
        state: 'won',
        lives: 10,
        gold: 500,
        wave: 5,
        totalWaves: 5,
        towers: [],
        elapsedMs: 60000
      });

      const modal = element.shadowRoot.querySelector('.modal');
      expect(modal.hasAttribute('hidden')).toBe(false);

      const title = element.shadowRoot.querySelector('.modal-title');
      expect(title.textContent).toBeTruthy(); // Should have victory text
    });

    it('shows defeat modal when state transitions to lost', () => {
      element.updateSnapshot({
        state: 'lost',
        lives: 0,
        gold: 100,
        wave: 3,
        totalWaves: 5,
        towers: [],
        elapsedMs: 45000
      });

      const modal = element.shadowRoot.querySelector('.modal');
      expect(modal.hasAttribute('hidden')).toBe(false);

      const title = element.shadowRoot.querySelector('.modal-title');
      expect(title.classList.contains('defeat')).toBe(true);
    });

    it('hides modal when resume() is called', () => {
      element.start();
      element.pause();

      const modal = element.shadowRoot.querySelector('.modal');
      expect(modal.hasAttribute('hidden')).toBe(false);

      element.resume();
      expect(modal.hasAttribute('hidden')).toBe(true);
    });

    it('hides modal and build menu when restart() is called', () => {
      element.start();
      element.pause();

      // Simulate build menu showing
      const buildMenu = element.shadowRoot.querySelector('.build-menu');
      buildMenu.hidden = false;

      element.restart();

      const modal = element.shadowRoot.querySelector('.modal');
      expect(modal.hasAttribute('hidden')).toBe(true);
      expect(buildMenu.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('modal interaction', () => {
    it('dispatches game-lose event when state transitions to lost', () => {
      let eventDispatched = false;
      element.addEventListener('game-lose', (e) => {
        eventDispatched = true;
      });

      element.updateSnapshot({
        state: 'lost',
        lives: 0,
        gold: 100,
        wave: 3,
        totalWaves: 5,
        towers: []
      });

      expect(eventDispatched).toBe(true);
    });

    it('dispatches game-win event when state transitions to won', () => {
      let eventDispatched = false;
      element.addEventListener('game-win', (e) => {
        eventDispatched = true;
      });

      element.updateSnapshot({
        state: 'won',
        lives: 10,
        gold: 500,
        wave: 5,
        totalWaves: 5,
        towers: [],
        elapsedMs: 60000
      });

      expect(eventDispatched).toBe(true);
    });
  });

  describe('tower-built and tower-sold events', () => {
    it('dispatches tower-built event with spec detail shape', () => {
      let eventDetail = null;
      element.addEventListener('tower-built', (e) => {
        eventDetail = e.detail;
      });

      element.start();
      element._handleBuildTower(0, 'archer');

      expect(eventDetail).toBeTruthy();
      // Spec §3.5: { slotId, towerType, cost, gold }
      expect(eventDetail.slotId).toBe('tower-slot-0');
      expect(eventDetail.towerType).toBe('archer');
      expect(eventDetail.cost).toBe(60);
      expect(eventDetail.gold).toBe(80); // 140 - 60
    });

    it('dispatches tower-sold event with spec detail shape', () => {
      let eventDetail = null;
      element.addEventListener('tower-sold', (e) => {
        eventDetail = e.detail;
      });

      element.start();
      element._handleBuildTower(0, 'archer');
      element._handleSellTower(0);

      expect(eventDetail).toBeTruthy();
      // Spec §3.5: { slotId, towerType, refund, gold }
      expect(eventDetail.slotId).toBe('tower-slot-0');
      expect(eventDetail.refund).toBe(36); // floor(60 * 0.60)
      expect(eventDetail.gold).toBe(116); // 80 after build + 36 refund
    });

    it('gold is deducted when building archer tower', () => {
      element.start();
      const initialGold = element.getSnapshot().gold;

      element._handleBuildTower(0, 'archer');

      expect(element.getSnapshot().gold).toBe(initialGold - 60);
    });

    it('gold is deducted when building mage tower', () => {
      element.start();
      const initialGold = element.getSnapshot().gold;

      element._handleBuildTower(0, 'mage');

      expect(element.getSnapshot().gold).toBe(initialGold - 90);
    });

    it('tower is added to snapshot when built', () => {
      element.start();

      element._handleBuildTower(2, 'archer');

      const towers = element.getSnapshot().towers;
      expect(towers.length).toBe(1);
      expect(towers[0].id).toBe('tower-slot-2');
      expect(towers[0].type).toBe('archer');
    });

    it('tower is removed from snapshot when sold', () => {
      element.start();

      element._handleBuildTower(2, 'archer');
      expect(element.getSnapshot().towers.length).toBe(1);

      element._handleSellTower(2);
      expect(element.getSnapshot().towers.length).toBe(0);
    });
  });

  describe('wave-start event', () => {
    it('dispatches wave-start event with spec detail shape when engine emits one', () => {
      // wave-start comes from the engine's wave controller, not from snapshot
      // changes. We drive the element-level event translator directly so the
      // assertion focuses on the spec's event-detail contract.
      element.start();
      let eventDetail = null;
      element.addEventListener('wave-start', (e) => {
        eventDetail = e.detail;
      });

      element._handleEngineEvent({ type: 'wave-start', wave: 1 });

      expect(eventDetail).toBeTruthy();
      // Spec §3.5: { wave, totalWaves }
      expect(eventDetail).toEqual({ wave: 1, totalWaves: 5 });
    });
  });
});
