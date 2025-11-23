/**
 * Video Module
 * Gère la vidéo héro et masquage du poster
 * 
 * Usage:
 *   import { video } from './modules/video.js';
 */

const video = (() => {
  const videoEl = document.querySelector('.hero-video-el');

  if (!videoEl) {
    return {
      init: () => { },
      getElement: () => null,
    };
  }

  /**
   * Ajoute la classe 'playing' quand la vidéo peut jouer
   */
  function handleCanPlay() {
    videoEl.classList.add('playing');
  }

  /**
   * Ajoute la classe quand la vidéo joue
   */
  function handlePlay() {
    videoEl.classList.add('playing');
  }

  /**
   * Retire la classe si la vidéo est en pause (buffering)
   */
  function handlePause() {
    videoEl.classList.remove('playing');
  }

  /**
   * Retire la classe quand la vidéo se termine
   */
  function handleEnded() {
    videoEl.classList.remove('playing');
  }

  /**
   * Initialize video module
   */
  function init() {
    // Event listeners
    videoEl.addEventListener('canplay', handleCanPlay);
    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('ended', handleEnded);

    // Si vidéo déjà chargée
    if (videoEl.readyState >= 2) {
      handleCanPlay();
    }
  }

  init();

  // API publique
  return {
    init,
    getElement: () => videoEl,
    play: () => videoEl.play(),
    pause: () => videoEl.pause(),
  };
})();

export default video;
