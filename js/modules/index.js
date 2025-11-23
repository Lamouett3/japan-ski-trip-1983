/**
 * Main Entry Point
 * Importe et initialise tous les modules ES6
 * 
 * Production: Concatenate tous les modules en un seul fichier script.js
 * Développement: Utiliser avec type="module" dans index.html
 */

// Import modules
import i18n from './i18n.js';
import theme from './theme.js';
import viewport from './viewport.js';
import carousel from './carousel.js';
import video from './video.js';
import collapsible from './collapsible.js';
import guestbook from './guestbook.js';
import forms from './forms.js';
import menu from './menu.js';
import shoji from './shoji.js';
import progressDots from './progress-dots.js';

/**
 * Initialize all modules
 */
function initializeApp() {
  console.log('🎌 Japan Site v1.3 - Modular Architecture');
  
  // Core modules
  i18n.init?.();
  theme.init?.();
  viewport.init?.();
  
  // Feature modules
  menu.init?.();
  carousel.init?.();
  video.init?.();
  collapsible.init?.();
  guestbook.init?.();
  forms.init?.();
  shoji.init?.();
  progressDots.init?.();
  
  console.log('✅ All modules initialized');
}

/**
 * DOM Ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for use in other modules if needed
export { i18n, theme, viewport, carousel, video, collapsible, guestbook, forms, menu, shoji, progressDots };
