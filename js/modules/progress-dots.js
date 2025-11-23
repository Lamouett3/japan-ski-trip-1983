/**
 * Progress Dots Module
 * Gère les indicateurs de progression lors du scroll
 * 
 * Usage:
 *   import { progressDots } from './modules/progress-dots.js';
 */

const progressDots = (() => {
  const dots = document.querySelectorAll('.progress-dot');
  const sections = document.querySelectorAll('[data-section]');

  if (dots.length === 0 || sections.length === 0) {
    return { init: () => { } };
  }

  /**
   * Determine which section is in view
   */
  function getCurrentSection() {
    let current = 0;
    
    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2) {
        current = index;
      }
    });

    return current;
  }

  /**
   * Update dots state
   */
  function updateDots() {
    const current = getCurrentSection();
    
    dots.forEach((dot, index) => {
      if (index === current) {
        dot.classList.add('active');
        dot.setAttribute('aria-current', 'page');
      } else {
        dot.classList.remove('active');
        dot.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Handle dot click
   */
  function handleDotClick(e) {
    const index = Array.from(dots).indexOf(e.target);
    if (index >= 0 && sections[index]) {
      sections[index].scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Throttle scroll for performance
   */
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Initialize progress dots
   */
  function init() {
    // Setup dots
    dots.forEach((dot, index) => {
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.setAttribute('aria-label', `Go to section ${index + 1}`);
      
      // Click handler
      dot.addEventListener('click', handleDotClick);
      
      // Keyboard support
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDotClick(e);
        }
      });
    });

    // Scroll listener with throttle
    const throttledUpdate = throttle(updateDots, 100);
    window.addEventListener('scroll', throttledUpdate, { passive: true });

    // Initial state
    updateDots();
  }

  init();

  // API publique
  return {
    updateDots,
    getCurrentSection,
    init,
  };
})();

export default progressDots;
