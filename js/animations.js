/**
 * FINAVIA - ANIMATIONS.JS
 * ========================
 * Gère les animations au scroll via IntersectionObserver.
 * - Apparition des éléments quand ils entrent dans la vue
 * - Animation des compteurs (chiffres clés)
 * - Parallax léger sur le hero
 *
 * Performance : utilise requestAnimationFrame + IntersectionObserver
 * pour ne pas bloquer le thread principal.
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCounters();
  initParallax();
  initProgressBars();
});

/* ============================================
   1. SCROLL REVEAL
   Les éléments apparaissent quand ils entrent en vue.
   Utilise IntersectionObserver (sans librairie).
   ============================================ */
function initScrollReveal() {
  // Sélectionne tous les éléments à animer
  const targets = document.querySelectorAll(
    '.service-card, .advantage-card, .team-card, .value-card, ' +
    '.testimonial-card, .step-card, .stat-item, .section-header, ' +
    '.faq-item, .process-step, .security-item, .loan-layout, ' +
    '.reveal, .reveal-left, .reveal-right, .country-badge'
  );

  if (!targets.length) return;

  // Si IntersectionObserver n'est pas disponible (vieux navigateurs)
  // on affiche tout directement
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view', 'visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view', 'visible');
        // Une fois visible, on arrête d'observer cet élément
        // (performance : évite des callbacks inutiles)
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,          // 12% de l'élément visible pour déclencher
    rootMargin: '0px 0px -50px 0px' // Déclenche un peu avant le bas
  });

  targets.forEach(el => observer.observe(el));
}

/* ============================================
   2. COMPTEURS ANIMÉS
   Les chiffres "comptent" jusqu'à la valeur cible
   quand ils entrent dans la vue.
   ============================================ */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

/**
 * Anime un compteur de 0 à sa valeur cible
 * @param {HTMLElement} el - L'élément à animer
 */
function animateCounter(el) {
  const target    = parseFloat(el.getAttribute('data-counter'));
  const suffix    = el.getAttribute('data-suffix') || '';
  const duration  = parseInt(el.getAttribute('data-duration')) || 2000;
  const decimals  = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;

  // Formatage du nombre selon la locale
  const locale = document.documentElement.lang || 'fr-FR';

  let startTime = null;
  const start = 0;

  function step(currentTime) {
    if (!startTime) startTime = currentTime;

    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing easeOutQuart pour un effet naturel
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = start + (target - start) * eased;

    // Formate selon le type
    let displayValue;
    if (decimals > 0) {
      displayValue = current.toFixed(decimals);
    } else {
      displayValue = Math.floor(current).toLocaleString(locale === 'fr' ? 'fr-FR' : locale);
    }

    el.textContent = displayValue + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Valeur finale exacte
      if (decimals > 0) {
        el.textContent = target.toFixed(decimals) + suffix;
      } else {
        el.textContent = target.toLocaleString(locale === 'fr' ? 'fr-FR' : locale) + suffix;
      }
    }
  }

  requestAnimationFrame(step);
}

/* ============================================
   3. PARALLAX LÉGER SUR LE HERO
   Les éléments décoratifs du hero bougent
   légèrement au scroll pour un effet de profondeur.
   Désactivé sur mobile (performance).
   ============================================ */
function initParallax() {
  // Ne pas activer sur mobile (économise la batterie)
  if (window.innerWidth < 768) return;

  const heroGlows = document.querySelectorAll('.hero-glow');
  if (!heroGlows.length) return;

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;

    heroGlows.forEach((glow, index) => {
      const speed = 0.15 + (index * 0.1);
      const yPos = -(scrollY * speed);
      glow.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
}

/* ============================================
   4. BARRES DE PROGRESSION ANIMÉES
   Pour les cartes de statistiques hero, etc.
   ============================================ */
function initProgressBars() {
  const bars = document.querySelectorAll('.hero-card-bar, [data-progress]');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target.getAttribute('data-progress') || '65';
        entry.target.style.width = '0%';
        requestAnimationFrame(() => {
          entry.target.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s';
          entry.target.style.width = target + '%';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  bars.forEach(bar => observer.observe(bar));
}

/* ============================================
   5. ANIMATION DES ÉTAPES DU PROCESSUS
   Les étapes s'animent les unes après les autres
   quand la section entre en vue.
   ============================================ */
function initProcessAnimation() {
  const processSteps = document.querySelectorAll('.process-step');
  if (!processSteps.length) return;

  // Déjà géré par .process-step.in-view via CSS animations
  // Mais on peut ajouter une logique supplémentaire ici si besoin
}

/* ============================================
   6. HOVER CARD 3D (effet subtil)
   Légère rotation 3D au survol des cartes premium
   ============================================ */
function init3DCards() {
  const premiumCards = document.querySelectorAll('.hero-card');
  if (!premiumCards.length) return;

  // Désactivé sur mobile
  if (window.innerWidth < 768) return;

  premiumCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform =
        `translateY(-12px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
      setTimeout(() => {
        card.style.transition = '';
      }, 500);
    });
  });
}

// Initialise après les autres
document.addEventListener('DOMContentLoaded', () => {
  // Petit délai pour laisser le CSS se charger
  setTimeout(() => {
    init3DCards();
    initProcessAnimation();
  }, 100);
});
