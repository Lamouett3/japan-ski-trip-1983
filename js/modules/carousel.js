/**
 * Carousel Module
 * Gère le carrousel des jours (sommaire)
 * 
 * Usage:
 *   import { carousel } from './modules/carousel.js';
 */

const carousel = (() => {
  const carouselEl = document.querySelector('#sommaire .carousel');
  if (!carouselEl) return { init: () => { } };

  const track = carouselEl.querySelector('.carousel-track');
  const items = Array.from(carouselEl.querySelectorAll('.carousel-item'));
  const btnPrev = carouselEl.querySelector('.carousel-btn.prev');
  const btnNext = carouselEl.querySelector('.carousel-btn.next');
  const dots = Array.from(carouselEl.querySelectorAll('.carousel-dots button'));

  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let currentX = 0;

  /**
   * Affiche un item du carrousel
   */
  function showItem(index) {
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;

    currentIndex = index;
    const offset = -currentIndex * 100;
    track.style.transform = `translateX(${offset}%)`;

    // Update dots
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-current', String(i === currentIndex));
    });
  }

  /**
   * Slide suivant
   */
  function next() {
    showItem(currentIndex + 1);
  }

  /**
   * Slide précédent
   */
  function prev() {
    showItem(currentIndex - 1);
  }

  /**
   * Gère le drag du carrousel
   */
  function handleMouseDown(e) {
    isDragging = true;
    startX = e.clientX || e.touches?.[0]?.clientX;
    currentX = startX;
    track.classList.add('dragging');
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    currentX = e.clientX || e.touches?.[0]?.clientX;
    const diff = currentX - startX;
    const translateX = -currentIndex * 100 + (diff / carouselEl.offsetWidth) * 100;
    track.style.transform = `translateX(${translateX}%)`;
  }

  function handleMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('dragging');

    const diff = currentX - startX;
    const threshold = carouselEl.offsetWidth * 0.2;

    if (diff > threshold) {
      prev();
    } else if (diff < -threshold) {
      next();
    } else {
      showItem(currentIndex);
    }
  }

  /**
   * Initialize carousel
   */
  function init() {
    // Button listeners
    if (btnPrev) btnPrev.addEventListener('click', prev);
    if (btnNext) btnNext.addEventListener('click', next);

    // Dot listeners
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => showItem(index));
    });

    // Drag listeners
    track.addEventListener('mousedown', handleMouseDown);
    track.addEventListener('touchstart', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    // Initial state
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

export default carousel;
