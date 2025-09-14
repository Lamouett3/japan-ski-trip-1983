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
    bgEls.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      const centerDelta = (rect.top + rect.height/2) - vh/2;
      const offset = centerDelta * depth;
      el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.12)`;
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
