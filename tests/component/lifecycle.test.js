import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/mini-tower-defense-element.js';

describe('mini-tower-defense lifecycle', () => {
  let element;

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  it('creates element with open Shadow Root', () => {
    element = document.createElement('mini-tower-defense');
    document.body.appendChild(element);

    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot.mode).toBe('open');
  });

  it('removing and re-inserting does not re-register custom element', () => {
    // First registration happens at module load time
    const firstDefinition = customElements.get('mini-tower-defense');
    expect(firstDefinition).toBeTruthy();

    element = document.createElement('mini-tower-defense');
    document.body.appendChild(element);

    // Remove and re-insert
    element.parentNode.removeChild(element);
    document.body.appendChild(element);

    // Should still be the same definition (not re-registered)
    const secondDefinition = customElements.get('mini-tower-defense');
    expect(secondDefinition).toBe(firstDefinition);
  });
});
