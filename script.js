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

  // Injecte les backgrounds depuis data-bg si non présents
  slides.forEach(slide => {
    if (slide.querySelector(".hero-video")) return; if (!slide.querySelector('.slide-bg')) {
      const bgUrl = slide.getAttribute('data-bg');
      if (bgUrl) {
        const bg = document.createElement('div');
        bg.className = 'slide-bg';
        bg.style.backgroundImage = `url('${bgUrl}')`;
        slide.prepend(bg);

        const ov = document.createElement('div');
        ov.className = 'slide-overlay';
        slide.prepend(ov);
      }
    }
  });

  if (prefersReduced) return; // accessibilité

  const bgEls = Array.from(document.querySelectorAll('.slide-bg'));

  function onScroll() {
    const vh = window.innerHeight;
    bgEls.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      const centerDelta = (rect.top + rect.height/2) - vh/2;
      const depth = 0.18; // vitesse parallax
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
    const rect = hero.getBoundingClientRect();
    const centerDelta = (rect.top + rect.height/2) - vh/2;
    const offset = centerDelta * 0.12; // plus doux
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
