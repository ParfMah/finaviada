/**
 * FINAVIA - CARROUSELS DU HERO (page d'accueil)
 * =================================================
 * Gère les deux séquences d'images du hero, aux comportements
 * volontairement différents :
 *
 * 1. CARROUSEL DE FOND (automatique) — .hero-bg-carousel
 *    Défile seul toutes les 6 secondes (fondu doux), avec une légende
 *    qui change en même temps que l'image. Des points cliquables
 *    permettent aussi une navigation manuelle ponctuelle, et le
 *    défilement automatique se met en pause au survol/au focus.
 *
 * 2. MINI-CARROUSEL "NOS SOLUTIONS EN IMAGES" (manuel uniquement)
 *    — .hero-mini-carousel
 *    Ne défile JAMAIS seul : l'utilisateur doit cliquer les flèches,
 *    les points, ou glisser au doigt sur mobile. Chaque image n'est
 *    chargée depuis Cloudinary qu'au moment où elle est affichée pour
 *    la première fois (chargement à la demande), afin de ne jamais
 *    télécharger des photos que le visiteur ne verra peut-être jamais.
 *
 * PERFORMANCE / SEO :
 * Aucun de ces deux carrousels ne charge la totalité de ses images
 * dès l'arrivée sur la page (voir js/cloudinary.js, attribut
 * data-cld-defer). Seule la toute première image de chaque carrousel
 * est chargée immédiatement ; les suivantes arrivent en différé ou à
 * la demande, sans jamais ralentir l'affichage initial de la page.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroCinematic();
  initHeroMiniCarousel(); // Retourne sans effet si l'élément est absent (pages secondaires)
});

/* ============================================
   1. CARROUSEL DE FOND — AUTOMATIQUE
   ============================================ */
function initHeroBgCarousel() {
  const root = document.querySelector('.hero-bg-carousel');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.hero-bg-slide'));
  const dots   = Array.from(document.querySelectorAll('.hero-bg-dot'));
  const captionEl = document.getElementById('heroBgCaption');
  if (!slides.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AUTOPLAY_DELAY = 6000;
  let current = 0;
  let timerId = null;

  function applyCaption(index) {
    if (!captionEl) return;
    const key = slides[index].getAttribute('data-caption-key');
    if (!key) return;
    captionEl.setAttribute('data-i18n', key);
    captionEl.textContent = (typeof i18n !== 'undefined' ? i18n.t(key) : captionEl.textContent);
  }

  function goTo(index) {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === current) return;

    slides[current].classList.remove('is-active');
    dots[current]?.classList.remove('is-active');

    current = nextIndex;

    slides[current].classList.add('is-active');
    dots[current]?.classList.add('is-active');
    applyCaption(current);

    // Charge la photo de la slide désormais active si pas déjà fait
    // (les slides 2+ sont en chargement différé, voir cloudinary.js)
    if (window.cloudinaryHelper) {
      window.cloudinaryHelper.loadCldElement(slides[current]);
    }
  }

  function next() {
    goTo(current + 1);
  }

  function start() {
    stop();
    if (prefersReducedMotion) return; // Respecte la préférence d'accessibilité
    timerId = setInterval(next, AUTOPLAY_DELAY);
  }

  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  // Navigation manuelle via les points (réinitialise le minuteur ensuite)
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      start();
    });
  });

  // Pause au survol / au focus clavier, reprise à la sortie
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    heroEl.addEventListener('mouseenter', stop);
    heroEl.addEventListener('mouseleave', start);
    heroEl.addEventListener('focusin', stop);
    heroEl.addEventListener('focusout', start);
  }

  applyCaption(0);
  start();

  // Réagit à un changement de langue en cours de visite (voir i18n.js)
  document.addEventListener('finavia:langchange', () => applyCaption(current));
}

/* ============================================
   2. MINI-CARROUSEL "NOS SOLUTIONS EN IMAGES" — MANUEL
   ============================================ */
function initHeroMiniCarousel() {
  const root  = document.querySelector('.hero-mini-carousel');
  const track = document.querySelector('.hero-mini-track');
  if (!root || !track) return;

  const slides  = Array.from(track.querySelectorAll('.hero-mini-slide'));
  const dots    = Array.from(root.querySelectorAll('.hero-mini-dot'));
  const prevBtn = root.querySelector('.hero-mini-prev');
  const nextBtn = root.querySelector('.hero-mini-next');
  if (!slides.length) return;

  let current = 0;

  function loadSlide(index) {
    const el = slides[index]?.querySelector('[data-cld]');
    if (el && window.cloudinaryHelper) {
      window.cloudinaryHelper.loadCldElement(el);
    }
  }

  function update() {
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));

    // Charge l'image affichée, ainsi que la suivante par anticipation
    // (transition plus fluide), sans jamais tout précharger d'un coup.
    loadSlide(current);
    loadSlide((current + 1) % slides.length);
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    update();
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // Navigation clavier quand le carrousel a le focus
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // Glissement tactile basique (mobile)
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      delta < 0 ? goTo(current + 1) : goTo(current - 1);
    }
  }, { passive: true });

  update(); // Affiche et charge la première carte immédiatement
}

/* ============================================
   3. HERO CINÉMATIQUE — SÉQUENCE D'ANIMATION
   ---------------------------------------------
   Phase 1 (0–2 s)   : Carte vidéo visible, contenu présent.
   Phase 2 (2–5 s)   : Expansion clip-path → plein écran (3 s).
   Phase 3 (5–5,9 s) : Voile semi-transparent en fondu.
   prefers-reduced-motion : état final immédiat, aucune transition.
   ============================================ */
function initHeroCinematic() {
  const videoWrap = document.getElementById('heroVideoWrap');
  const overlay   = document.getElementById('heroVideoOverlay');
  if (!videoWrap || !overlay) return;

  /* Accessibilité : si l'utilisateur préfère peu de mouvement,
     on saute directement à l'état final sans aucune animation. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    videoWrap.classList.add('is-expanded');
    overlay.classList.add('is-visible');
    return;
  }

  /* Phase 2 — Expansion de la carte (démarre à 2 s) */
  setTimeout(() => {
    videoWrap.classList.add('is-expanded');
  }, 2000);

  /* Phase 3 — Apparition du voile (démarre après la fin de la transition :
     2 s délai + 3 s transition + 100 ms marge de sécurité = 5 100 ms) */
  setTimeout(() => {
    overlay.classList.add('is-visible');
  }, 5100);
}
