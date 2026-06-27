/**
 * FINAVIA - MAIN.JS
 * ==================
 * Script principal du site FINAVIA.
 * Gère : navigation, header scroll, menu mobile,
 * accordéon FAQ, newsletter, année footer,
 * active link, smooth scroll, abandon tracking init.
 */

/* ============================================
   1. INITIALISATION PRINCIPALE
   Exécuté quand le DOM est prêt
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initHeader();
  initMobileMenu();
  initFAQ();
  initNewsletter();
  initActiveNav();
  initFooterYear();
  initSmoothScroll();
  initAbandonTracking();
  initToast();
});

/* ============================================
   1-BIS. PRÉCHARGEUR DE PAGE
   Nettoyage DOM après la fin de l'animation CSS.
   IMPORTANT : ceci est purement un bonus de "propreté" —
   le CSS seul (voir main.css, .page-loader) garantit déjà
   que le calque devient invisible et non-interactif après
   ~1,1s, même si ce script ne s'exécutait pas. On retire
   simplement l'élément du DOM pour ne laisser aucune trace
   une fois l'animation terminée (zéro coût résiduel).
   ============================================ */
function initPageLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  const removeLoader = () => loader.remove();

  // Se déclenche naturellement à la fin de l'animation CSS
  loader.addEventListener('animationend', removeLoader, { once: true });

  // Filet de sécurité : si l'événement ne se déclenche pas pour une
  // raison quelconque (onglet en arrière-plan, etc.), on retire quand
  // même le calque après un court délai pour ne jamais bloquer le site.
  setTimeout(removeLoader, 1500);
}

/* ============================================
   2. HEADER - COMPORTEMENT AU SCROLL
   Le header prend une ombre quand on défile
   ============================================ */
function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 50;

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  // Optimisation : throttle le scroll event
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Vérification initiale
  onScroll();
}

/* ============================================
   3. MENU MOBILE
   Hamburger → slide-in depuis la droite
   Croix X → fermeture avec animation inverse
   ============================================ */
function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay    = document.getElementById('mobileOverlay');
  const closeBtn   = document.getElementById('mobileClose');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!hamburger || !mobileMenu) return;

  // Ouvre le menu
  function openMenu() {
    mobileMenu.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Bloque le scroll page
  }

  // Ferme le menu
  function closeMenu() {
    mobileMenu.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore le scroll
  }

  // Événements
  hamburger.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  // Ferme au clic sur un lien du menu
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Ferme avec la touche Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* ============================================
   4. FAQ ACCORDÉON
   Click sur question → ouverture/fermeture réponse
   Un seul item ouvert à la fois
   ============================================ */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Ferme tous les items
      faqItems.forEach(i => {
        i.classList.remove('active');
        const ans = i.querySelector('.faq-answer');
        if (ans) ans.style.maxHeight = '0';
        const q = i.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      // Si l'item était fermé, on l'ouvre
      if (!isOpen) {
        item.classList.add('active');
        const answer = item.querySelector('.faq-answer');
        const ansInner = item.querySelector('.faq-answer-inner');
        if (answer && ansInner) {
          // Calcule la hauteur réelle du contenu
          answer.style.maxHeight = ansInner.scrollHeight + 'px';
        }
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ============================================
   5. NEWSLETTER
   Validation email + simulation d'abonnement
   ============================================ */
function initNewsletter() {
  // Footer newsletter
  const newsletterBtn   = document.getElementById('newsletterBtn');
  const newsletterEmail = document.getElementById('newsletterEmail');

  if (newsletterBtn && newsletterEmail) {
    newsletterBtn.addEventListener('click', () => {
      handleNewsletterSubmit(newsletterEmail, newsletterBtn);
    });

    newsletterEmail.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleNewsletterSubmit(newsletterEmail, newsletterBtn);
      }
    });
  }
}

function handleNewsletterSubmit(emailInput, btn) {
  const email = emailInput.value.trim();

  if (!email || !isValidEmail(email)) {
    emailInput.style.borderColor = '#EF4444';
    emailInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.2)';
    emailInput.focus();
    setTimeout(() => {
      emailInput.style.borderColor = '';
      emailInput.style.boxShadow = '';
    }, 2000);
    return;
  }

  // Simule l'envoi (backend se chargera de l'API réelle)
  const originalText = btn.textContent;
  btn.textContent = '✓';
  btn.style.background = '#10B981';
  emailInput.value = '';

  showToast(i18n ? i18n.t('footer.newsletter.success') || 'Abonnement confirmé !' : 'Abonnement confirmé !', 'success');

  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 3000);

  // Envoie au backend si disponible
  if (window.FINAVIA_API) {
    fetch(`${window.FINAVIA_API}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).catch(() => { /* Silently fail si backend non connecté */ });
  }
}

/* ============================================
   6. NAVIGATION ACTIVE
   Marque le lien actif selon la page courante
   ============================================ */
function initActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  // Links desktop
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPage = href.split('/').pop();
    if (linkPage === currentPath ||
       (currentPath === '' && linkPage === 'index.html') ||
       (currentPath === 'index.html' && linkPage === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Links mobile
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPage = href.split('/').pop();
    if (linkPage === currentPath) {
      link.classList.add('active');
    }
  });
}

/* ============================================
   7. ANNÉE DU FOOTER
   Met à jour dynamiquement l'année
   ============================================ */
function initFooterYear() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* ============================================
   8. SMOOTH SCROLL
   Défilement doux vers les ancres (#section)
   ============================================ */
function initSmoothScroll() {
  const HEADER_HEIGHT = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--header-height')) || 80;

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const targetPos = target.getBoundingClientRect().top
        + window.pageYOffset
        - HEADER_HEIGHT
        - 20; // Marge supplémentaire

      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });
    });
  });
}

/* ============================================
   9. ABANDON TRACKING - INITIALISATION
   Si l'utilisateur a un formulaire en cours
   et quitte la page, on sauvegarde sa progression.
   La logique complète est dans form.js.
   ============================================ */
function initAbandonTracking() {
  // Récupère une éventuelle demande abandonnée
  try {
    const abandoned = localStorage.getItem('finavia_form_draft');
    if (abandoned) {
      const draft = JSON.parse(abandoned);
      // Affiche un banner de reprise si on est sur la homepage
      if (draft.email && !window.location.pathname.includes('demande-de-pret')) {
        showResumeBanner(draft);
      }
    }
  } catch (e) { /* ignoré */ }
}

function showResumeBanner(draft) {
  // Vérifie que le draft a moins de 7 jours
  const AGE_LIMIT = 7 * 24 * 60 * 60 * 1000;
  if (draft.timestamp && Date.now() - draft.timestamp > AGE_LIMIT) {
    localStorage.removeItem('finavia_form_draft');
    return;
  }

  // Crée le banner
  const banner = document.createElement('div');
  banner.id = 'resume-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 24px;
    background: #0A2540;
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    z-index: 9990;
    max-width: 360px;
    animation: slideUp 0.4s ease forwards;
    display: flex;
    align-items: center;
    gap: 16px;
  `;

  banner.innerHTML = `
    <div style="flex: 1; min-width: 0;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">
        Continuez votre demande
      </div>
      <div style="font-size: 12px; color: rgba(255,255,255,0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        Vous aviez commencé une demande de prêt.
      </div>
    </div>
    <div style="display: flex; gap: 8px; flex-shrink: 0;">
      <a href="demande-de-pret.html" style="background: #00A878; color: white; padding: 8px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap;">
        Reprendre
      </a>
      <button onclick="document.getElementById('resume-banner').remove(); localStorage.removeItem('finavia_form_draft');"
        style="background: rgba(255,255,255,0.15); color: white; padding: 8px; border-radius: 20px; font-size: 18px; line-height: 1; cursor: pointer; border: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ×
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  // Auto-fermeture après 10s
  setTimeout(() => {
    const el = document.getElementById('resume-banner');
    if (el) el.remove();
  }, 10000);
}

/* ============================================
   10. SYSTÈME DE TOAST (notifications)
   Affiche un message temporaire en bas de l'écran
   ============================================ */
let toastTimeout = null;

function initToast() {
  // Crée l'élément toast s'il n'existe pas
  if (!document.getElementById('finavia-toast')) {
    const toast = document.createElement('div');
    toast.id = 'finavia-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  // Expose la fonction globalement
  window.showToast = showToast;
}

function showToast(message, type = 'info', duration = 4000) {
  const toast = document.getElementById('finavia-toast');
  if (!toast) return;

  // Nettoie le précédent timeout
  if (toastTimeout) clearTimeout(toastTimeout);

  // Configure le toast
  toast.textContent = message;
  toast.className = `toast ${type}`;

  // Icône selon le type
  const icons = {
    success: '✓ ',
    error: '✕ ',
    info: 'ℹ ',
    warning: '⚠ ',
  };
  toast.textContent = (icons[type] || '') + message;

  // Affiche
  toast.classList.add('visible');

  // Cache après la durée
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}

/* ============================================
   11. SCROLL VERS LA SECTION SUIVANTE (hero)
   Bouton scroll en bas du hero
   ============================================ */
const heroScroll = document.querySelector('.hero-scroll');
if (heroScroll) {
  heroScroll.addEventListener('click', () => {
    const firstSection = document.querySelector('.section, .stats-section');
    if (firstSection) {
      firstSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ============================================
   12. UTILITAIRES
   Fonctions réutilisables
   ============================================ */

/**
 * Valide une adresse email
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valide un numéro de téléphone européen
 */
function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return /^\+?[0-9]{8,15}$/.test(cleaned);
}

/**
 * Formate un montant en euros
 */
function formatEuro(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Debounce : limite la fréquence d'appel d'une fonction
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Expose les utilitaires globalement
window.finaviaUtils = { isValidEmail, isValidPhone, formatEuro, debounce, showToast };
