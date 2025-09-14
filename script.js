// === Thème clair/sombre ===
(function() {
  const themeBtn = document.getElementById('theme');
  const themeBtn2 = document.getElementById('theme2');
  function toggleTheme(){
    const root = document.documentElement;
    const now = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', now);
    try { localStorage.setItem('theme', now); } catch(e){}
  }
  [themeBtn, themeBtn2].forEach(b=> b && b.addEventListener('click', toggleTheme));
  try {
    const saved = localStorage.getItem('theme');
    if(saved){ document.documentElement.setAttribute('data-theme', saved); }
  } catch(e){}
})();

// === Année footer ===
document.getElementById('y').textContent = new Date().getFullYear();

// === Inject backgrounds + Parallax au scroll ===
(function() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = Array.from(document.querySelectorAll('.slide'));

  // Création des éléments BG/Overlay si absents, sans charger d'image tout de suite
  slides.forEach(slide => {
    if (slide.querySelector('.hero-video')) return; // le HERO vidéo gère son propre fond

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

    // Configure position focale si fournie (ex: data-pos="center 30%")
    const pos = slide.getAttribute('data-pos');
    if (pos) bg.style.backgroundPosition = pos;

    // Configure intensité d'overlay si fournie (ex: data-overlay="0.45")
    const overlayRaw = parseFloat(slide.getAttribute('data-overlay'));
    const s = isNaN(overlayRaw) ? 0.35 : Math.max(0, Math.min(0.85, overlayRaw));
    ov.style.background = `radial-gradient(80% 60% at 50% 30%, rgba(0,0,0, ${s * 0.2}), rgba(0,0,0, ${s}))`;

    // Prépare lazy-load du background depuis data-bg
    const url = slide.getAttribute('data-bg');
    if (url) {
      bg.dataset.src = url;
    }

    // Lisibilité par défaut sur image: forcer encre claire si non précisé
    if (!slide.hasAttribute('data-ink')) {
      slide.setAttribute('data-ink', 'light');
    }

    // Injecte l'effet Shoji local si absent et non désactivé
    if (!slide.querySelector('.shoji-local') && !slide.hasAttribute('data-shoji-off')) {
      const shoji = document.createElement('div');
      shoji.className = 'shoji-local';
      shoji.innerHTML = '<div class="panel left"></div><div class="panel right"></div>';
      slide.appendChild(shoji);
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

  function playShoji(){
    if (busy) return;
    busy = true;
    shoji.classList.add('visible');
    left.classList.remove('open');
    right.classList.remove('open');
    void shoji.offsetWidth;
    left.classList.add('open');
    right.classList.add('open');
    setTimeout(() => { shoji.classList.remove('visible'); busy = false; }, 460);
  }

  window.playShojiTransition = playShoji;
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
    if (window.playShojiTransition && id !== currentId && rect && window.SHOJI_GLOBAL_ENABLED !== false) {
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
