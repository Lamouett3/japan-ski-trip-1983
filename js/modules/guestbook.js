/**
 * Guestbook Module
 * Gère l'affichage et soumission des commentaires
 * 
 * Usage:
 *   import { guestbook } from './modules/guestbook.js';
 */

const guestbook = (() => {
  const API_URL = 'http://localhost:3000/api/guestbook';
  const displayContainer = document.querySelector('.guest-display');
  const popover = document.querySelector('.guest-popover');

  if (!displayContainer || !popover) {
    return { init: () => { } };
  }

  let guests = [];
  let currentIndex = 0;

  /**
   * Récupère les commentaires du serveur
   */
  async function loadGuests() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Load failed');
      guests = await res.json();
      if (guests.length > 0) {
        showGuest(0);
      }
    } catch (e) {
      console.warn('Guestbook load error:', e);
    }
  }

  /**
   * Affiche un commentaire
   */
  function showGuest(index) {
    if (guests.length === 0) return;
    if (index < 0) index = guests.length - 1;
    if (index >= guests.length) index = 0;

    currentIndex = index;
    const guest = guests[currentIndex];

    let card = displayContainer.querySelector('.guest-card');
    if (card) card.classList.remove('enter');

    setTimeout(() => {
      card = displayContainer.querySelector('.guest-card') || document.createElement('div');
      card.className = 'guest-card enter';
      card.innerHTML = `
        <p class="text">"${escapeHtml(guest.message)}"</p>
        <p class="name">— ${escapeHtml(guest.name)}</p>
        <p class="stars">${'★'.repeat(guest.rating)}</p>
      `;
      if (!displayContainer.querySelector('.guest-card')) {
        displayContainer.appendChild(card);
      } else {
        displayContainer.querySelector('.guest-card').replaceWith(card);
      }
    }, guest ? 0 : 320);
  }

  /**
   * Soumets un commentaire
   */
  async function submitGuest(name, message, rating) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, rating: parseInt(rating) }),
      });
      if (!res.ok) throw new Error('Submit failed');
      await loadGuests();
      closePopover();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  /**
   * Ouvre le popover
   */
  function openPopover() {
    popover.removeAttribute('hidden');
  }

  /**
   * Ferme le popover
   */
  function closePopover() {
    popover.setAttribute('hidden', '');
  }

  /**
   * Échappe HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Initialize
   */
  function init() {
    loadGuests();

    // Form submission
    const form = popover.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('input[name="name"]').value;
        const message = form.querySelector('textarea[name="message"]').value;
        const rating = form.querySelector('input[name="rating"]:checked').value;
        submitGuest(name, message, rating);
      });
    }

    // Close button
    const closeBtn = popover.querySelector('button.gray');
    if (closeBtn) closeBtn.addEventListener('click', closePopover);

    // Navigation
    const prevBtn = displayContainer.querySelector('.carousel-btn.prev');
    const nextBtn = displayContainer.querySelector('.carousel-btn.next');
    if (prevBtn) prevBtn.addEventListener('click', () => showGuest(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showGuest(currentIndex + 1));
  }

  init();

  // API publique
  return {
    loadGuests,
    showGuest,
    submitGuest,
    openPopover,
    closePopover,
    init,
  };
})();

export default guestbook;
