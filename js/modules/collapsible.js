/**
 * Collapsible Module
 * Gère les éléments "lire plus" / "jour programme"
 * 
 * Usage:
 *   import { collapsible } from './modules/collapsible.js';
 */

const collapsible = (() => {
  /**
   * Setup un élément collapsible
   */
  function setup(btn, wrapper) {
    let open = false;

    function toggle() {
      open = !open;
      if (open) {
        wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      } else {
        wrapper.style.maxHeight = '0';
        btn.setAttribute('aria-expanded', 'false');
      }
    }

    btn.addEventListener('click', toggle);

    // Handle resize
    window.addEventListener('resize', () => {
      if (open) {
        wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
      }
    }, { passive: true });

    // Handle i18n changes
    try {
      document.addEventListener('i18n:applied', () => {
        if (open) {
          setTimeout(() => {
            wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
          }, 100);
        }
      });
    } catch (_) { }

    return { toggle, isOpen: () => open };
  }

  /**
   * Initialize tous les collapsibles
   */
  function init() {
    const collapsibles = document.querySelectorAll('[data-collapsible]');
    collapsibles.forEach(btn => {
      const wrapperId = btn.getAttribute('data-collapsible');
      const wrapper = document.getElementById(wrapperId);
      if (wrapper) {
        setup(btn, wrapper);
      }
    });
  }

  init();

  // API publique
  return {
    setup,
    init,
  };
})();

export default collapsible;
