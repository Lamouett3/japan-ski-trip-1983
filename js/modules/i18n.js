/**
 * Internationalization (i18n) Module
 * Gère la traduction du site (français/anglais)
 * 
 * Usage:
 *   import { i18n } from './modules/i18n.js';
 *   i18n.setLang('fr');
 */

const i18n = (() => {
  const storeKey = 'lang';
  const defaultLang = 'fr';
  const root = document.documentElement;

  /**
   * Définit le label du bouton langue avec drapeaux SVG
   */
  function setBtnLabel(lang) {
    const btn = document.getElementById('lang');
    if (!btn) return;

    const svgFR = (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" aria-hidden="true">'
      + '<rect x="0" y="0" width="300" height="200" rx="12" ry="12" fill="#fff"/>'
      + '<rect x="0" y="0" width="100" height="200" rx="12" ry="12" fill="#3563A9"/>'
      + '<rect x="200" y="0" width="100" height="200" rx="12" ry="12" fill="#D84C4C"/>'
      + '</svg>'
    );

    const svgGB = (function() {
      const bg = '<rect width="60" height="40" rx="4" ry="4" fill="#243B76"/>';
      const whiteDiag = '<path d="M0,0 L7,0 L60,33 L60,40 L53,40 L0,7 Z M60,0 L53,0 L0,33 L0,40 L7,40 L60,7 Z" fill="#FFFFFF" opacity="0.95"/>';
      const redDiag = '<path d="M0,0 L4.8,0 L60,28.8 L60,40 L55.2,40 L0,11.2 Z M60,0 L55.2,0 L0,28.8 L0,40 L4.8,40 L60,11.2 Z" fill="#D84C4C"/>';
      const whiteCross = '<rect x="0" y="16" width="60" height="8" fill="#FFFFFF" opacity="0.95"/><rect x="26" y="0" width="8" height="40" fill="#FFFFFF" opacity="0.95"/>';
      const redCross = '<rect x="0" y="18" width="60" height="4" fill="#D84C4C"/><rect x="28" y="0" width="4" height="40" fill="#D84C4C"/>';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" aria-hidden="true">${bg}${whiteDiag}${redDiag}${whiteCross}${redCross}</svg>`;
    })();

    btn.innerHTML = (lang === 'fr') ? svgFR : svgGB;
    btn.classList.add('lang-flag');
    btn.setAttribute('aria-label', (lang === 'fr') ? 'Langue: Français' : 'Language: English');
    btn.setAttribute('title', (lang === 'fr') ? 'Français' : 'English');
  }

  /**
   * Charge le dictionnaire de traduction
   */
  async function loadDict(lang) {
    const url = `i18n/${lang}.json`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('i18n load failed');
    return res.json();
  }

  /**
   * Applique le dictionnaire à tous les éléments data-i18n
   */
  function applyDict(dict) {
    // Contenu texte
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = key.split('.').reduce((o, k) => (o || {})[k], dict);
      if (typeof val === 'string') {
        el.textContent = val;
      }
    });

    // Contenu HTML
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = key.split('.').reduce((o, k) => (o || {})[k], dict);
      if (typeof val === 'string') {
        el.innerHTML = val;
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = key.split('.').reduce((o, k) => (o || {})[k], dict);
      if (typeof val === 'string') {
        try { el.placeholder = val; } catch (_) { }
      }
    });
  }

  /**
   * Change la langue du site
   */
  async function setLang(lang) {
    try { localStorage.setItem(storeKey, lang); } catch (e) { }
    root.lang = lang;
    setBtnLabel(lang);

    try {
      const dict = await loadDict(lang);
      try { window.I18N_DICT = dict; } catch (_) { }
      applyDict(dict);
      try { document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang, dict } })); } catch (_) { }
    } catch (e) {
      console.warn('i18n load error:', e);
    }
  }

  /**
   * Récupère la langue actuelle
   */
  function getLang() {
    return root.lang || defaultLang;
  }

  // Initialisation au chargement
  const saved = (() => { try { return localStorage.getItem(storeKey); } catch (e) { return null; } })();
  const initial = saved || defaultLang;
  setBtnLabel(initial);
  setLang(initial);

  // Event listener pour changer la langue
  const langBtnEl = document.getElementById('lang');
  if (langBtnEl) {
    langBtnEl.addEventListener('click', async () => {
      const cur = getLang() === 'fr' ? 'en' : 'fr';
      setLang(cur);
    });
  }

  // API publique
  return {
    setLang,
    getLang,
    loadDict,
    applyDict,
  };
})();

export default i18n;
