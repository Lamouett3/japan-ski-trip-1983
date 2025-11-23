/**
 * Viewport Module
 * Fixe la hauteur 100vh sur iOS Safari (vh dynamique)
 * 
 * Usage:
 *   import { viewport } from './modules/viewport.js';
 */

const viewport = (() => {
  /**
   * Met à jour la variable CSS --vh
   */
  function updateVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  /**
   * Initialize
   */
  function init() {
    updateVH();
    window.addEventListener('resize', updateVH);
    window.addEventListener('orientationchange', updateVH);
  }

  init();

  // API publique
  return {
    updateVH,
    init,
  };
})();

export default viewport;
