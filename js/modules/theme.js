/**
 * Theme Module - Light/Dark Mode Management
 * Gère le switch entre thèmes clair et sombre
 * 
 * Usage:
 *   import { theme } from './modules/theme.js';
 *   theme.toggle();
 */

const theme = (() => {
  const themeBtn = document.getElementById('theme');
  const themeBtn2 = document.getElementById('theme2');

  /**
   * Toggle entre light et dark
   */
  function toggle() {
    const root = document.documentElement;
    const now = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    set(now);
  }

  /**
   * Définit le thème
   */
  function set(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    try { localStorage.setItem('theme', theme); } catch (e) { }

    // Sync aria-pressed pour accessibilité
    [themeBtn, themeBtn2].forEach(b => {
      if (b) b.setAttribute('aria-pressed', String(theme === 'dark'));
    });

    // Dispatch event pour autres modules
    try {
      document.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme } }));
    } catch (_) { }
  }

  /**
   * Récupère le thème actuel
   */
  function get() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  // Initialisation
  function init() {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) {
        set(saved);
      } else {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        [themeBtn, themeBtn2].forEach(b => {
          if (b) b.setAttribute('aria-pressed', String(cur === 'dark'));
        });
      }
    } catch (e) { }
  }

  // Event listeners
  [themeBtn, themeBtn2].forEach(b => {
    if (b) b.addEventListener('click', toggle);
  });

  init();

  // API publique
  return {
    toggle,
    set,
    get,
    init,
  };
})();

export default theme;
