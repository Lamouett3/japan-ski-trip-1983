/**
 * Menu Module
 * Gère le menu mobile et navigation
 * 
 * Usage:
 *   import { menu } from './modules/menu.js';
 */

const menu = (() => {
  const menuBtn = document.getElementById('menu');
  const nav = document.querySelector('.nav.jpn');
  const links = nav?.querySelector('.links');

  if (!menuBtn || !nav || !links) {
    return { init: () => { } };
  }

  /**
   * Toggle menu mobile
   */
  function toggle() {
    nav.classList.toggle('menu-open');
    const isOpen = nav.classList.contains('menu-open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  }

  /**
   * Ferme le menu
   */
  function close() {
    nav.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  /**
   * Ouvre le menu
   */
  function open() {
    nav.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
  }

  /**
   * Handle scroll
   */
  function handleScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  /**
   * Initialize menu
   */
  function init() {
    // Menu button
    menuBtn.addEventListener('click', toggle);

    // Close on link click
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', close);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Scroll detection
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  init();

  // API publique
  return {
    toggle,
    open,
    close,
    init,
  };
})();

export default menu;
