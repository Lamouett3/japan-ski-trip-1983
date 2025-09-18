// Active le shoji global de démarrage (porte au chargement)
window.SHOJI_GLOBAL_ENABLED = true;

// === Thème clair/sombre ===
(function() {
  const themeBtn = document.getElementById('theme');
  const langBtn = document.getElementById('lang');
  const themeBtn2 = document.getElementById('theme2');
  const nav = document.querySelector('.nav.jpn');
  const menuBtn = document.getElementById('menu');
  const navLinks = document.getElementById('nav-links');
  function toggleTheme(){
    const root = document.documentElement;
    const now = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', now);
    try { localStorage.setItem('theme', now); } catch(e){}
    // Accessibilité: mettre à jour aria-pressed pour les boutons thème
    [themeBtn, themeBtn2].forEach(b => {
      if (b) b.setAttribute('aria-pressed', String(now === 'dark'));
    });
  }
  [themeBtn, themeBtn2].forEach(b=> b && b.addEventListener('click', toggleTheme));
  try {
    const saved = localStorage.getItem('theme');
    if(saved){
      document.documentElement.setAttribute('data-theme', saved);
      // Sync aria-pressed with restored theme
      [themeBtn, themeBtn2].forEach(b => { if (b) b.setAttribute('aria-pressed', String(saved === 'dark')); });
    } else {
      // Sync aria-pressed with current attribute
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      [themeBtn, themeBtn2].forEach(b => { if (b) b.setAttribute('aria-pressed', String(cur === 'dark')); });
    }
  } catch(e){}
})();

// === i18n (simple) ===
(function(){
  const root = document.documentElement;
  const storeKey = 'lang';
  const defaultLang = 'fr';
  function setBtnLabel(lang){
    const btn = document.getElementById('lang');
    if (!btn) return;
    const svgFR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#ffffff"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>';
    const svgGB = (function(){
      // Simplified Union Jack
      const bg = '<rect width="60" height="40" fill="#012169"/>';
      const whiteDiag = '<path d="M0,0 L8,0 L60,32 L60,40 L52,40 L0,8 Z M60,0 L52,0 L0,32 L0,40 L8,40 L60,8 Z" fill="#FFF"/>';
      const redDiag = '<path d="M0,0 L4.8,0 L60,28.8 L60,40 L55.2,40 L0,11.2 Z M60,0 L55.2,0 L0,28.8 L0,40 L4.8,40 L60,11.2 Z" fill="#C8102E"/>';
      const whiteCross = '<rect x="0" y="16" width="60" height="8" fill="#FFF"/><rect x="26" y="0" width="8" height="40" fill="#FFF"/>';
      const redCross = '<rect x="0" y="18" width="60" height="4" fill="#C8102E"/><rect x="28" y="0" width="4" height="40" fill="#C8102E"/>';
      return `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 60 40\" aria-hidden=\"true\">${bg}${whiteDiag}${redDiag}${whiteCross}${redCross}</svg>`;
    })();
    btn.innerHTML = (lang === 'fr') ? svgFR : svgGB;
    btn.classList.add('lang-flag');
    btn.setAttribute('aria-label', (lang === 'fr') ? 'Langue: Français' : 'Language: English');
    btn.setAttribute('title', (lang === 'fr') ? 'Français' : 'English');
  }
  async function loadDict(lang){
    const url = `i18n/${lang}.json`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('i18n load failed');
    return res.json();
  }
  function applyDict(dict){
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = key.split('.').reduce((o,k)=> (o||{})[k], dict);
      if (typeof val === 'string') {
        el.textContent = val;
      }
    });
    // Supporte les contenus HTML contrôlés (ex: titres avec <br>)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = key.split('.').reduce((o,k)=> (o||{})[k], dict);
      if (typeof val === 'string') {
        el.innerHTML = val;
      }
    });
  }
  async function setLang(lang){
    try { localStorage.setItem(storeKey, lang); } catch(e){}
    root.lang = lang;
    setBtnLabel(lang);
    try {
      const dict = await loadDict(lang);
      applyDict(dict);
    } catch(e) { /* ignore */ }
  }
  window.I18N_setLang = setLang;
  const saved = (()=>{ try { return localStorage.getItem(storeKey); } catch(e){ return null; } })();
  const initial = saved || defaultLang;
  setBtnLabel(initial);
  setLang(initial);
  const langBtnEl = document.getElementById('lang');
  if (langBtnEl){
    langBtnEl.addEventListener('click', async ()=>{
      const cur = (root.lang || initial) === 'fr' ? 'en' : 'fr';
      setLang(cur);
    });
  }
})();

// === Année footer ===
document.getElementById('y').textContent = new Date().getFullYear();

// === Lang suggestion (FR/EN) with geo/IP fallback and Accept-Language ===
// Update: integrate with i18n switch if available
(function(){
  const root = document.documentElement;
  const saved = (()=>{ try { return localStorage.getItem('lang'); } catch(e){ return null; } })();
  if (saved) { root.lang = saved; return; }

  function guessFromNavigator(){
    const langs = navigator.languages || [navigator.language || navigator.userLanguage || ''];
    const joined = langs.join(',').toLowerCase();
    return joined.includes('fr') ? 'fr' : 'en';
  }

  function buildBanner(target){
    // Avoid duplicate
    if (document.querySelector('.lang-banner')) return;
    const b = document.createElement('div');
    b.className = 'lang-banner';
    // bilingual copy to avoid dependency on current lang
    b.innerHTML = `
      <span>${target === 'en' ? 'Switch to English?' : 'Basculer en français ?'}</span>
      <button class="btn outline" data-lang="en">English</button>
      <button class="btn outline" data-lang="fr">Français</button>
      <button class="btn" data-dismiss title="Fermer">✕</button>
    `;
    document.body.appendChild(b);
    b.querySelectorAll('button[data-lang]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.getAttribute('data-lang');
        try { localStorage.setItem('lang', lang); } catch(_){}
        if (window.I18N_setLang) { window.I18N_setLang(lang); }
        else { root.lang = lang; }
        b.remove();
      });
    });
    b.querySelector('[data-dismiss]').addEventListener('click', ()=> b.remove());
  }

  function geoSuggest(){
    // Try IP-based country to refine decision
    const controller = new AbortController();
    const to = setTimeout(()=> controller.abort(), 1500);
    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        clearTimeout(to);
        const cc = (data && data.country) || '';
        const frCountries = new Set(['FR','BE','CH','CA','LU','MC','GP','MQ','RE','PF','NC','YT','BL','MF','PM','WF','TF']);
        const target = frCountries.has(cc) ? 'fr' : 'en';
        if (target !== (root.lang || 'fr')) buildBanner(target);
      })
      .catch(() => {
        // fallback to navigator
        const target = guessFromNavigator();
        if (target !== (root.lang || 'fr')) buildBanner(target);
      });
  }

  // Start with navigator; if different from current, show quickly; also try geo for refinement
  const navGuess = guessFromNavigator();
  if (navGuess !== (root.lang || 'fr')) buildBanner(navGuess);
  // Kick geo (non-blocking)
  try { geoSuggest(); } catch(e){}
})();

// === Nav glass: accentue le verre au scroll ===
(function(){
  const nav = document.querySelector('.nav.jpn');
  if (!nav) return;
  function update(){
    if (window.scrollY > 8) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('load', update, { passive: true });
  update();
})();

// === Menu mobile (hamburger) ===
(function(){
  const nav = document.querySelector('.nav.jpn');
  const btn = document.getElementById('menu');
  const links = document.getElementById('nav-links');
  if (!nav || !btn || !links) return;
  function close(){
    nav.classList.remove('menu-open');
    btn.setAttribute('aria-expanded', 'false');
    links.setAttribute('aria-hidden', 'true');
  }
  function toggle(){
    const open = nav.classList.toggle('menu-open');
    btn.setAttribute('aria-expanded', String(open));
    links.setAttribute('aria-hidden', String(!open));
  }
  btn.addEventListener('click', toggle);
  // Ferme au clic sur un lien
  links.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) close();
  });
  // Ferme au clic extérieur
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('menu-open')) return;
    if (e.target === btn || btn.contains(e.target)) return;
    if (links.contains(e.target)) return;
    close();
  });
  // Ferme à ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  // Init ARIA
  btn.setAttribute('aria-expanded', 'false');
  links.setAttribute('aria-hidden', 'true');
})();

// === Inject backgrounds + Parallax au scroll ===
(function() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = Array.from(document.querySelectorAll('.slide'));

  // Création des éléments BG/Overlay si absents, sans charger d'image tout de suite
  slides.forEach(slide => {
    const hasHeroVideo = !!slide.querySelector('.hero-video');
    const onProgrammePage = /programme/i.test(location.pathname);
    const isDaySlide = /^jour\d+$/i.test(slide.id || '');

    // Pour toutes les slides: lisibilité et shoji local
    if (!slide.hasAttribute('data-ink')) {
      slide.setAttribute('data-ink', 'light');
    }
    // Shoji local uniquement sur les slides des jours (programme.html) ou si explicitement autorisé
    const allowLocalShoji = !hasHeroVideo && (onProgrammePage || isDaySlide) && !slide.hasAttribute('data-shoji-off');
    const existingLocal = slide.querySelector('.shoji-local');
    if (allowLocalShoji) {
      if (!existingLocal) {
        const shoji = document.createElement('div');
        shoji.className = 'shoji-local';
        shoji.innerHTML = '<div class="panel left"></div><div class="panel right"></div>';
        slide.appendChild(shoji);
      }
    } else if (existingLocal) {
      existingLocal.remove();
    }

    // Pour les slides sans vidéo HERO: gérer background/overlay/images
    if (!hasHeroVideo) {
      let bg = slide.querySelector('.slide-bg');
      let ov = slide.querySelector('.slide-overlay');
      if (!bg) {
        bg = document.createElement('div');
        bg.className = 'slide-bg';
        slide.prepend(bg);
      }
      if (!ov) {
        ov = document.createElement('div');
        ov.className = 'slide-overlay';
        slide.prepend(ov);
      }

      const pos = slide.getAttribute('data-pos');
      if (pos) bg.style.backgroundPosition = pos;

      const overlayRaw = parseFloat(slide.getAttribute('data-overlay'));
      const s = isNaN(overlayRaw) ? 0.35 : Math.max(0, Math.min(0.85, overlayRaw));
      ov.style.background = `radial-gradient(80% 60% at 50% 30%, rgba(0,0,0, ${s * 0.2}), rgba(0,0,0, ${s}))`;

      const url = slide.getAttribute('data-bg');
      if (url) {
        bg.dataset.src = url;
      }
    }
  });

  // Lazy-load des backgrounds quand la slide approche la vue
  const bgEls = Array.from(document.querySelectorAll('.slide-bg'));
  const eagerLoad = new Set();

  function loadBg(el) {
    if (!el || el.dataset.loaded) return;
    const src = el.dataset.src;
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url('${src}')`;
      el.dataset.loaded = '1';
    };
    img.src = src;
  }

  // Charge immédiatement les 2 premières slides visibles
  bgEls.slice(0, 2).forEach(el => { loadBg(el); eagerLoad.add(el); });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          loadBg(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '200px 0px', threshold: 0.01 });

    bgEls.forEach(el => { if (!eagerLoad.has(el)) io.observe(el); });
  } else {
    // Fallback: charge tout
    bgEls.forEach(loadBg);
  }

  if (prefersReduced) return; // accessibilité (stop parallax)

  function onScroll() {
    const vh = window.innerHeight;
    const vw = window.innerWidth || 1024;
    const depth = vw <= 360 ? 0.10 : (vw <= 480 ? 0.14 : 0.18); // parallax adouci sur petits écrans
    const maxShift = vh * 0.22; // clamp pour éviter de dévoiler le bord
    bgEls.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      const centerDelta = (rect.top + rect.height/2) - vh/2;
      const raw = centerDelta * depth;
      const offset = Math.max(-maxShift, Math.min(maxShift, raw));
      el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.16)`;
    });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  onScroll();
// Parallax vidéo du hero + fallback autoplay
(function(){
  const heroVideoEl = document.querySelector('.hero-video-el');
  if (!heroVideoEl) return;

  function onScrollHero(){
    const hero = heroVideoEl.closest('.slide');
    if (!hero) return;
    const vh = window.innerHeight;
    const vw = window.innerWidth || 1024;
    const factor = vw <= 360 ? 0.08 : (vw <= 480 ? 0.1 : 0.12);
    const rect = hero.getBoundingClientRect();
    const centerDelta = (rect.top + rect.height/2) - vh/2;
    const offset = centerDelta * factor; // plus doux sur petits écrans
    heroVideoEl.style.transform = `translate3d(0, ${offset}px, 0) scale(1.03)`;
  }
  window.addEventListener('scroll', () => { requestAnimationFrame(onScrollHero); }, {passive:true});
  onScrollHero();

  // Fallback si autoplay bloqué
  heroVideoEl.play && heroVideoEl.play().catch(() => {
    const img = document.createElement('img');
    img.src = heroVideoEl.getAttribute('poster') || 'images/hero-poster.jpg';
    img.alt = 'Montagne enneigée au Japon et Tokyo la nuit';
    img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover';
    heroVideoEl.parentNode.replaceChild(img, heroVideoEl);
  });
})();

  // plus d'auto‑ouverture shoji sur la slide HERO
})();

// === Auto-snap doux à la fin du scroll ===
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const container = document.querySelector('.slides');
  if (!container) return;

  let rafId = null;
  let endTimer = null;
  let isAuto = false;
  let lastY = window.scrollY;
  let lastT = performance.now();
  let velocity = 0; // px/ms (moyenne simple)

  function getTargetY() {
    const slides = Array.from(container.querySelectorAll('.slide'));
    if (!slides.length) return null;
    const vh = window.innerHeight;
    const vw = window.innerWidth || 1024;
    const alignToCenter = vw >= 768; // desktop: alignement plus centré
    let best = null;
    let bestDist = Infinity;
    for (const s of slides) {
      const r = s.getBoundingClientRect();
      // Mesure par rapport au centre du viewport pour un ressenti plus naturel
      const dist = Math.abs((r.top + r.height/2) - vh/2);
      if (dist < bestDist) { bestDist = dist; best = s; }
    }
    if (!best) return null;
    const r = best.getBoundingClientRect();
    const centerOffset = alignToCenter ? Math.max(0, (vh - Math.min(r.height, vh)) / 2) : 0;
    // Vise à placer le haut de la slide à "centerOffset" depuis le haut du viewport
    const target = window.scrollY + r.top - centerOffset;
    return Math.max(0, target);
  }

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function animateTo(targetY, duration){
    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < 2) return;
    const start = performance.now();
    isAuto = true;
    const prevSnap = container.style.scrollSnapType;
    container.style.scrollSnapType = 'none';

    function step(now){
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      window.scrollTo(0, startY + delta * eased);
      if (t < 1 && isAuto) {
        rafId = requestAnimationFrame(step);
      } else {
        container.style.scrollSnapType = prevSnap || '';
        isAuto = false;
      }
    }
    rafId = requestAnimationFrame(step);
  }

  function smoothSnap() {
    if (isAuto) return;
    const targetY = getTargetY();
    if (targetY == null) return;
    const cur = window.scrollY;
    const dist = Math.abs(targetY - cur);

    // Si déjà très proche, évite anim inutile
    if (dist < 6) return;

    // N’anime que si on est raisonnablement près d’un point d’ancrage
    const vh = window.innerHeight;
    if (dist > vh * 0.75) return;

    // Durée adaptative selon distance et vitesse (inertie perçue)
    const base = 320 + (dist / vh) * 280; // 320–600ms environ
    const speedAdj = Math.max(0.85, Math.min(1.25, 1.05 - velocity * 0.25));
    const duration = Math.max(260, Math.min(900, base * speedAdj));

    animateTo(targetY, duration);
  }

  function onScroll(){
    if (isAuto) return;
    const now = performance.now();
    const dy = window.scrollY - lastY;
    const dt = Math.max(16, now - lastT);
    // Vitesse lissée
    const instV = Math.abs(dy) / dt; // px/ms
    velocity = velocity * 0.6 + instV * 0.4;
    lastY = window.scrollY; lastT = now;

    if (endTimer) clearTimeout(endTimer);
    // Délai selon vitesse: plus on va vite, plus on attend
    const delay = velocity < 0.05 ? 90 : velocity < 0.2 ? 140 : 220;
    endTimer = setTimeout(smoothSnap, delay);
  }

  function cancelAuto(){
    if (rafId) cancelAnimationFrame(rafId);
    isAuto = false;
    velocity = 0;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', cancelAuto, { passive: true });
  window.addEventListener('touchstart', cancelAuto, { passive: true });
})();

// === Effet Shoji: panneaux qui s'ouvrent au changement de slide ===
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  if (window.SHOJI_GLOBAL_ENABLED === false) return;

  const shoji = document.createElement('div');
  shoji.className = 'shoji';
  shoji.innerHTML = '<div class="panel left"></div><div class="panel right"></div>';
  document.body.appendChild(shoji);

  const left = shoji.querySelector('.left');
  const right = shoji.querySelector('.right');
  let busy = false;

  function playShoji(durationMs){
    if (busy) return;
    busy = true;
    // Transition personnalisée optionnelle
    const dur = typeof durationMs === 'number' ? Math.max(100, durationMs) : null;
    const prevTl = left.style.transition;
    const prevTr = right.style.transition;
    if (dur){
      // Pour une longue ouverture « bienvenue », on garde un easing fluide
      const easing = (dur >= 1500) ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(.22,.61,.36,1)';
      left.style.transition = `transform ${dur}ms ${easing}`;
      right.style.transition = `transform ${dur}ms ${easing}`;
    }
    // Si c'est une longue ouverture initiale, masque les shoji locaux
    const isInitial = !!dur && dur > 1500;
    if (isInitial) {
      document.body.classList.add('shoji-opening');
      // Filet de sécurité: au pire, retire le verrou après la durée prévue + marge
      setTimeout(() => { document.body.classList.remove('shoji-opening'); }, (dur || 0) + 1200);
    }
    shoji.classList.add('visible');
    left.classList.remove('open');
    right.classList.remove('open');
    // Force reflow
    void shoji.offsetWidth;
    // Déclenchement: rythme fluide pour longue ouverture
    const useDelay = !!dur && dur >= 1500;
    // Pour garantir exactement 4s perçues quand dur=4000, on évite tout délai/décalage
    const START_DELAY = useDelay ? 0 : 0;
    const STAGGER = useDelay ? 0 : 0;
    setTimeout(() => { left.classList.add('open'); }, START_DELAY);
    setTimeout(() => { right.classList.add('open'); }, START_DELAY + STAGGER);
    const endAfter = dur ? dur + 80 : 520;
    let ended = false;
    function endOnce(){
      if (ended) return; ended = true;
      shoji.classList.remove('visible');
      if (dur){ left.style.transition = prevTl; right.style.transition = prevTr; }
      if (isInitial) {
        document.body.classList.add('shoji-initial-sync');
        document.body.classList.remove('shoji-opening');
        setTimeout(() => { document.body.classList.remove('shoji-initial-sync'); }, 180);
      }
      busy = false;
      left.removeEventListener('transitionend', endOnce);
      right.removeEventListener('transitionend', endOnce);
    }
    // Fin pilotée par timer + transitionend (robustesse)
    setTimeout(endOnce, endAfter);
    left.addEventListener('transitionend', endOnce);
    right.addEventListener('transitionend', endOnce);
  }

  window.playShojiTransition = playShoji;
  // Ouverture initiale à l'arrivée sur le site (fluide, 4s)
  let initialPlayed = false;
  function triggerInitialShoji(){
    if (initialPlayed) return; initialPlayed = true;
    // petit rafraîchissement pour s'assurer que le DOM et les styles sont appliqués
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const D = 4000;
          playShoji(D);
          // Sur la page d'accueil, on ne garde QUE l'ouverture initiale
          const isHome = /(?:^\/$|index\.html$)/.test(location.pathname);
          if (isHome) {
            setTimeout(() => { window.SHOJI_GLOBAL_ENABLED = false; }, D + 200);
          }
        } catch(e){}
      }, 60);
    });
  }
  if (document.readyState === 'complete') {
    triggerInitialShoji();
  } else {
    window.addEventListener('load', triggerInitialShoji, { once: true });
    document.addEventListener('DOMContentLoaded', triggerInitialShoji, { once: true });
  }

  // Déverrouillage de secours si l'utilisateur interagit mais que le verrou persiste
  ['wheel','touchstart','pointerdown','keydown','scroll'].forEach(evt => {
    window.addEventListener(evt, () => {
      document.body.classList.remove('shoji-opening');
    }, { passive: true });
  });
})();

// === Sommaire: init carousel inside #sommaire ===
(function(){
  const wrap = document.querySelector('#sommaire .rec-list');
  if (!wrap) return;
  const cards = Array.from(wrap.children);
  if (!cards.length) return;

  const carousel = document.createElement('div');
  carousel.className = 'carousel';
  const track = document.createElement('div');
  track.className = 'carousel-track';
  const dots = document.createElement('div'); dots.className = 'carousel-dots';
  const prev = document.createElement('button'); prev.className = 'carousel-btn prev'; prev.setAttribute('aria-label','Précédent'); prev.textContent = '‹';
  const next = document.createElement('button'); next.className = 'carousel-btn next'; next.setAttribute('aria-label','Suivant'); next.textContent = '›';

  cards.forEach((card, i) => {
    const item = document.createElement('div'); item.className = 'carousel-item';
    item.appendChild(card);
    track.appendChild(item);
    const d = document.createElement('button'); d.setAttribute('aria-label', `Slide ${i+1}`); if (i===0) d.setAttribute('aria-current','true');
    dots.appendChild(d);
  });

  wrap.replaceWith(carousel);
  carousel.appendChild(track);
  // Retire les flèches; navigation au swipe + dots
  carousel.appendChild(dots);

  // Crée un carrousel infini par clones en bordure
  const originalCount = track.children.length;
  if (!originalCount) return;
  const firstClone = track.firstElementChild.cloneNode(true);
  const lastClone = track.lastElementChild.cloneNode(true);
  track.insertBefore(lastClone, track.firstChild);
  track.appendChild(firstClone);

  let index = 1; // commence sur la 1ère carte réelle
  const DEFAULT_MS = 380;
  function setTransition(ms){
    if (!ms || ms <= 0) {
      track.style.transition = 'none';
    } else {
      track.style.transition = `transform ${ms}ms cubic-bezier(.22,.61,.36,1)`;
    }
  }
  function effectiveIndex(){ return ((index - 1 + originalCount) % originalCount); }
  function update(){
    const w = carousel.clientWidth;
    track.style.transform = `translateX(${-index * w}px)`;
    dots.querySelectorAll('button').forEach((b, i)=> b.setAttribute('aria-current', i===effectiveIndex() ? 'true':'false'));
  }
  function goTo(i, immediate=false){
    index = i;
    if (immediate) setTransition(0);
    update();
    if (immediate) { void track.offsetWidth; setTransition(DEFAULT_MS); }
  }
  // Navigation via dots (mappe vers index réel + offset clone)
  dots.querySelectorAll('button').forEach((b, i)=> b.addEventListener('click', ()=> goTo(i+1)) );

  // Swipe (infinite)
  let startX=0, curX=0, dragging=false, moved=false, pid=null;
  track.addEventListener('pointerdown', (e)=>{ dragging=true; moved=false; pid=e.pointerId; startX=e.clientX; curX=startX; setTransition(0); track.classList.add('dragging'); });
  track.addEventListener('pointermove', (e)=>{ if(!dragging) return; curX=e.clientX; const dx = curX-startX; const w=carousel.clientWidth; if (!moved && Math.abs(dx) > 6) { moved=true; try{ track.setPointerCapture(pid); }catch(_){} } if (moved){ e.preventDefault(); track.style.transform=`translateX(${-index*w + dx}px)`; } });
  function endDrag(){ if(!dragging) return; dragging=false; track.classList.remove('dragging'); const w=carousel.clientWidth; const dx = curX - startX; if (moved) { try{ track.releasePointerCapture(pid); }catch(_){} const adx = Math.abs(dx); if (adx > w*0.15) { // momentum: plus on glisse loin, plus l'anim est rapide
        const t = Math.max(0, Math.min(1, (adx - w*0.15) / (w*0.85))); // 0..1
        const dur = Math.round(DEFAULT_MS - (DEFAULT_MS - 180) * t); // 380ms -> 180ms
        setTransition(dur);
        goTo(index + (dx<0?1:-1));
      } else {
        // snap back vite mais doux
        setTransition(220);
        update();
      } } else { setTransition(220); update(); } }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointerleave', endDrag);
  track.addEventListener('pointercancel', ()=>{ dragging=false; track.classList.remove('dragging'); setTransition(DEFAULT_MS); update(); });

  // Reboucle sans à-coup après animation
  track.addEventListener('transitionend', ()=>{
    const n = originalCount;
    if (index === 0) { goTo(n, true); }
    else if (index === n+1) { goTo(1, true); }
  });

  // Trackpad (macOS) — empêche le geste "page précédente" en capturant le wheel horizontal
  // et déclenche un slide next/prev avec un petit cooldown
  let wheelBusy = false;
  const WHEEL_COOLDOWN = 320;
  carousel.addEventListener('wheel', (e) => {
    const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
    if (ax > ay && ax > 2) {
      // Geste horizontal → on gère nous-mêmes
      e.preventDefault();
      if (wheelBusy) return;
      wheelBusy = true;
      const dir = e.deltaX > 0 ? 1 : -1;
      setTransition(260);
      goTo(index + dir);
      setTimeout(()=>{ wheelBusy = false; }, WHEEL_COOLDOWN);
    }
  }, { passive: false });

  window.addEventListener('resize', update, { passive:true });
  goTo(1, true);
})();

// === Dots de progression + lien actif nav ===
(function(){
  const slides = Array.from(document.querySelectorAll('.slide[id]'));
  if (!slides.length) return;

  // Crée le conteneur de dots
  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'progress-dots';
  dotsWrap.setAttribute('aria-label', 'Navigation des sections');
  document.body.appendChild(dotsWrap);

  // Liens nav
  const navLinks = Array.from(document.querySelectorAll('.nav .links a'));

  const dots = new Map();
  slides.forEach((s) => {
    const id = s.id;
    const btn = document.createElement('button');
    const label = (s.querySelector('h1,h2')?.textContent || id).trim();
    btn.setAttribute('type','button');
    btn.setAttribute('aria-label', label);
    btn.addEventListener('click', () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    dotsWrap.appendChild(btn);
    dots.set(id, btn);
  });

  let currentId = null;

  function setActive(id, rect){
    const onProgrammePage = /programme/i.test(location.pathname);
    dots.forEach((btn, key) => btn.setAttribute('aria-current', key === id ? 'true' : 'false'));
    // aria-current sur la nav
    navLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      const hash = href.includes('#') ? href.split('#')[1] : '';
      if (hash) {
        a.setAttribute('aria-current', hash === id ? 'true' : 'false');
      }
    });
    // Déclenche l'effet Shoji global (si activé) quand on change réellement de slide et que l'alignement est suffisant
    const openingNow = document.body.classList.contains('shoji-opening');
    if (onProgrammePage && window.playShojiTransition && id !== currentId && rect && window.SHOJI_GLOBAL_ENABLED !== false && !openingNow) {
      const vh = window.innerHeight;
      const nearCenter = Math.abs((rect.top + rect.height/2) - vh/2) < vh * 0.12;
      const nearTop = Math.abs(rect.top) < vh * 0.18;
      if (nearCenter || nearTop) {
        window.playShojiTransition();
        currentId = id;
      } else {
        currentId = id;
      }
    } else {
      currentId = id;
    }
  }

  function updateActive(){
    const vh = window.innerHeight;
    let bestId = null;
    let bestDist = Infinity;
    let bestRect = null;
    for (const s of slides){
      const r = s.getBoundingClientRect();
      const center = r.top + r.height/2;
      const dist = Math.abs(center - vh/2);
      if (dist < bestDist){ bestDist = dist; bestId = s.id; bestRect = r; }
    }
    if (bestId) setActive(bestId, bestRect);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking){
      requestAnimationFrame(() => { updateActive(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', () => { updateActive(); }, { passive: true });
  updateActive();
})();
