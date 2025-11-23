/**
 * Shoji Module
 * Gère les animations style portes japonaises (shoji)
 * 
 * Usage:
 *   import { shoji } from './modules/shoji.js';
 */

const shoji = (() => {
  const container = document.querySelector('.shoji-gallery');

  if (!container) {
    return { init: () => { } };
  }

  const items = container.querySelectorAll('.shoji-item');
  const nextBtn = container.querySelector('.shoji-next');
  const prevBtn = container.querySelector('.shoji-prev');
  let currentIndex = 0;

  /**
   * Calcule si on est sur mobile/desktop
   */
  function isMobile() {
    return window.innerWidth < 768;
  }

  /**
   * Affiche item par index
   */
  function showItem(index) {
    // Clamp index
    index = (index + items.length) % items.length;
    currentIndex = index;

    items.forEach((item, i) => {
      item.style.transform = `translateX(${(i - index) * 100}%)`;
      item.setAttribute('aria-hidden', String(i !== index));
    });
  }

  /**
   * Go to next slide
   */
  function next() {
    showItem(currentIndex + 1);
  }

  /**
   * Go to prev slide
   */
  function prev() {
    showItem(currentIndex - 1);
  }

  /**
   * Keyboard navigation
   */
  function handleKeyboard(e) {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  }

  /**
   * Keyboard on focus
   */
  function setupKeyboardNav() {
    container.addEventListener('keydown', handleKeyboard);
  }

  /**
   * Initialize shoji gallery
   */
  function init() {
    // Button listeners
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    // Setup items
    items.forEach((item, i) => {
      item.setAttribute('role', 'img');
      item.setAttribute('aria-label', `Item ${i + 1} of ${items.length}`);
      item.setAttribute('aria-hidden', String(i !== 0));
      item.style.transition = 'transform 0.6s ease-out';
    });

    // Keyboard navigation
    setupKeyboardNav();

    // Show first item
    showItem(0);
  }

  init();

  // API publique
  return {
    next,
    prev,
    showItem,
    init,
  };
})();

export default shoji;
