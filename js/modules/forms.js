/**
 * Forms Module
 * Gère le formulaire de contact
 * 
 * Usage:
 *   import { forms } from './modules/forms.js';
 */

const forms = (() => {
  const contactForm = document.querySelector('.contact-form');
  if (!contactForm) return { init: () => { } };

  /**
   * Soumet le formulaire de contact
   */
  async function submitContact(e) {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch('contact.php', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Submit failed');

      // Succès
      alert('Message envoyé! Merci!');
      contactForm.reset();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  }

  /**
   * Initialize forms
   */
  function init() {
    if (contactForm) {
      contactForm.addEventListener('submit', submitContact);
    }
  }

  init();

  // API publique
  return {
    submitContact,
    init,
  };
})();

export default forms;
