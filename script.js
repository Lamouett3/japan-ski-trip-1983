// Désactive le shoji global de démarrage (on utilise un shoji local sur le HERO uniquement)
window.SHOJI_GLOBAL_ENABLED = false;

// === Thème clair/sombre ===
(function() {
  const themeBtn = document.getElementById('theme');
  const langBtn = document.getElementById('lang');
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

// === i18n (simple) ===
(function(){
  const root = document.documentElement;
  const storeKey = 'lang';
  const defaultLang = 'fr';
  function setBtnLabel(lang){
    const btn = document.getElementById('lang');
    if (!btn) return;
    btn.textContent = (lang === 'fr') ? 'FR' : 'EN';
    btn.setAttribute('aria-label', (lang === 'fr') ? 'Langue: Français' : 'Language: English');
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

// === Inject backgrounds + Parallax au scroll ===
(function() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = Array.from(document.querySelectorAll('.slide'));

  // Création des éléments BG/Overlay si absents, sans charger d'image tout de suite
  slides.forEach(slide => {
    const hasHeroVideo = !!slide.querySelector('.hero-video');

    // Pour toutes les slides: lisibilité et shoji local
    if (!slide.hasAttribute('data-ink')) {
      slide.setAttribute('data-ink', 'light');
    }
    if (!slide.querySelector('.shoji-local') && !slide.hasAttribute('data-shoji-off')) {
      const shoji = document.createElement('div');
      shoji.className = 'shoji-local';
      shoji.innerHTML = '<div class="panel left"></div><div class="panel right"></div>';
      slide.appendChild(shoji);
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

  // — Auto‑ouverture shoji local sur la slide HERO au chargement —
  (function(){
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const heroSlide = document.getElementById('top');
    if (!heroSlide) return;
    const shoji = heroSlide.querySelector('.shoji-local');
    if (!shoji) return;
    const left = shoji.querySelector('.panel.left');
    const right = shoji.querySelector('.panel.right');
    if (!left || !right) return;

    // Empêche l'ouverture au survol pendant l'animation initiale
    document.body.classList.add('hero-shoji-opening');

    // Ferme visuellement (au cas où) et définit une ouverture lente
    shoji.classList.remove('open');
    const D = 2500; // durée d'ouverture (ms)
    const easing = 'cubic-bezier(.22,.61,.36,1)';
    const prevL = left.style.transition;
    const prevR = right.style.transition;
    left.style.transition = `transform ${D}ms ${easing}`;
    right.style.transition = `transform ${D}ms ${easing}`;

    // Lance l'ouverture au prochain frame pour garantir l'état initial appliqué
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        shoji.classList.add('open');
      });
    });

    // Après l'ouverture, réactive le comportement normal, mais garde ouvert jusqu'à 1ère interaction
    const cleanup = () => {
      document.body.classList.remove('hero-shoji-opening');
      // Restaure transitions par défaut
      left.style.transition = prevL;
      right.style.transition = prevR;
      // À la première interaction, revenir au comportement normal (en retirant .open)
      const unlock = () => {
        shoji.classList.remove('open');
        window.removeEventListener('wheel', unlock, { passive: true });
        window.removeEventListener('touchstart', unlock, { passive: true });
        window.removeEventListener('mousemove', unlock, { passive: true });
      };
      window.addEventListener('wheel', unlock, { passive: true, once: true });
      window.addEventListener('touchstart', unlock, { passive: true, once: true });
      window.addEventListener('mousemove', unlock, { passive: true, once: true });
    };

    setTimeout(cleanup, D + 80);
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

  function playShoji(durationMs){
    if (busy) return;
    busy = true;
    // Transition personnalisée optionnelle
    const dur = typeof durationMs === 'number' ? Math.max(100, durationMs) : null;
    const prevTl = left.style.transition;
    const prevTr = right.style.transition;
    if (dur){
      const easing = 'cubic-bezier(.22,.61,.36,1)';
      left.style.transition = `transform ${dur}ms ${easing}`;
      right.style.transition = `transform ${dur}ms ${easing}`;
    }
    // Si c'est une longue ouverture initiale, masque les shoji locaux
    const isInitial = !!dur && dur > 1500;
    if (isInitial) {
      document.body.classList.add('shoji-opening');
    }
    shoji.classList.add('visible');
    left.classList.remove('open');
    right.classList.remove('open');
    void shoji.offsetWidth;
    left.classList.add('open');
    right.classList.add('open');
    const endAfter = dur ? dur + 80 : 460;
    setTimeout(() => {
      shoji.classList.remove('visible');
      // Restaure les transitions par défaut si on les a surchargées
      if (dur){ left.style.transition = prevTl; right.style.transition = prevTr; }
      if (isInitial) {
        // Pendant un court instant, maintient le shoji local du HERO en position ouverte sans animation
        document.body.classList.add('shoji-initial-sync');
        // Retire le verrou d'ouverture globale
        document.body.classList.remove('shoji-opening');
        // Après une petite latence, rend la main aux transitions normales des shoji locaux
        setTimeout(() => { document.body.classList.remove('shoji-initial-sync'); }, 180);
      }
      busy = false;
    }, endAfter);
  }

  window.playShojiTransition = playShoji;
  // Ouverture initiale à l'arrivée sur le site (suspens 2.5s)
  let initialPlayed = false;
  function triggerInitialShoji(){
    if (initialPlayed) return; initialPlayed = true;
    // petit rafraîchissement pour s'assurer que le DOM et les styles sont appliqués
    requestAnimationFrame(() => { setTimeout(() => { try { playShoji(2500); } catch(e){} }, 40); });
  }
  if (document.readyState === 'complete') {
    triggerInitialShoji();
  } else {
    window.addEventListener('load', triggerInitialShoji, { once: true });
    document.addEventListener('DOMContentLoaded', triggerInitialShoji, { once: true });
  }
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
  carousel.appendChild(prev);
  carousel.appendChild(next);
  carousel.appendChild(dots);

  let index = 0;
  function update(){
    const w = carousel.clientWidth;
    track.style.transform = `translateX(${-index * w}px)`;
    dots.querySelectorAll('button').forEach((b, i)=> b.setAttribute('aria-current', i===index ? 'true':'false'));
  }
  function goTo(i){
    const max = track.children.length - 1;
    index = Math.max(0, Math.min(max, i));
    update();
  }
  prev.addEventListener('click', ()=> goTo(index-1));
  next.addEventListener('click', ()=> goTo(index+1));
  dots.querySelectorAll('button').forEach((b, i)=> b.addEventListener('click', ()=> goTo(i)) );

  // Swipe
  let startX=0, curX=0, dragging=false;
  track.addEventListener('pointerdown', (e)=>{ dragging=true; startX=e.clientX; track.style.transition='none'; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', (e)=>{ if(!dragging) return; curX=e.clientX; const dx = curX-startX; const w=carousel.clientWidth; track.style.transform=`translateX(${-index*w + dx}px)`; });
  track.addEventListener('pointerup', (e)=>{ if(!dragging) return; dragging=false; track.releasePointerCapture(e.pointerId); track.style.transition=''; const w=carousel.clientWidth; const dx = curX - startX; if (Math.abs(dx) > w*0.2) { goTo(index + (dx<0?1:-1)); } else { update(); } });
  window.addEventListener('resize', update, { passive:true });
  update();
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
