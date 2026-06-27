/**
 * FINAVIA - INTÉGRATION CLOUDINARY (FRONTEND)
 * ===============================================
 * Permet d'afficher dynamiquement, sur tout le site, des images
 * hébergées sur le compte Cloudinary de FINAVIA — sans jamais
 * toucher au code. Le principe :
 *
 * 1. Chaque emplacement d'image porte un attribut data-cld="dossier/nom"
 *    (voir le catalogue complet dans CLOUDINARY-IMAGES.md à la racine
 *    du projet frontend).
 * 2. Au chargement de la page, ce script vérifie si une image existe
 *    réellement sur Cloudinary pour cet identifiant.
 *    - Si OUI (vous l'avez uploadée) → elle s'affiche automatiquement,
 *      optimisée (format + qualité automatiques, taille adaptée à
 *      l'écran du visiteur).
 *    - Si NON (pas encore uploadée) → l'emplacement affiche un visuel
 *      "Image à venir" propre, JAMAIS une icône d'image cassée.
 * 3. Vous n'avez donc qu'à uploader vos photos dans votre médiathèque
 *    Cloudinary, dans le dossier "finavia/", en respectant exactement
 *    les noms du catalogue, pour qu'elles apparaissent sur le site.
 *
 * CHARGEMENT DIFFÉRÉ / À LA DEMANDE (carrousels du hero) :
 * Certains emplacements (ex : 2ᵉ et 3ᵉ image du carrousel de fond,
 * cartes 2 à 5 du mini-carrousel "Nos solutions en images") portent
 * en plus l'attribut data-cld-defer="true" : ils sont volontairement
 * IGNORÉS par le balayage automatique au chargement de la page, pour
 * ne jamais faire concurrence à l'image principale (LCP) ni gaspiller
 * de bande passante sur des images que le visiteur ne verra peut-être
 * jamais. Ils sont chargés :
 *   - soit après l'événement "load" de la page (différé, priorité basse),
 *   - soit à la demande, quand le carrousel correspondant les affiche
 *     pour la première fois (voir js/hero-carousel.js).
 *
 * SEO / PERFORMANCE :
 * - f_auto  → Cloudinary livre automatiquement le meilleur format
 *   supporté par le navigateur du visiteur (WebP, AVIF...).
 * - q_auto  → compression automatiquement optimisée (qualité visuelle
 *   maximale pour le poids minimal).
 * - La largeur demandée est calculée selon la taille RÉELLE d'affichage
 *   de chaque image (et la densité d'écran), pour ne jamais télécharger
 *   plus lourd que nécessaire — un point clé pour la vitesse de
 *   chargement, donc pour le référencement.
 * - Aucune image cassée n'est jamais montrée à un visiteur ni à un
 *   robot d'indexation : le texte alternatif (alt / aria-label) est
 *   toujours présent dans le HTML dès le chargement de la page, qu'une
 *   photo réelle soit déjà chargée ou non.
 */

const CLOUDINARY_CLOUD_NAME = 'duramdsjz';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Construit une URL Cloudinary optimisée pour un identifiant donné.
 * @param {string} publicId - Identifiant de l'image (ex: "finavia/loans/personal")
 * @param {Object} options
 * @param {number} [options.width] - Largeur cible en pixels
 * @param {number} [options.height] - Hauteur cible en pixels
 * @param {string} [options.crop] - Mode de recadrage Cloudinary (fill, scale, fit...)
 * @param {string} [options.gravity] - Point focal du recadrage (auto, face...)
 * @returns {string} URL complète prête à l'emploi
 */
function buildCloudinaryUrl(publicId, options = {}) {
  const { width, height, crop = 'fill', gravity = 'auto' } = options;
  const transforms = ['f_auto', 'q_auto'];

  if (width)  transforms.push(`w_${Math.round(width)}`);
  if (height) transforms.push(`h_${Math.round(height)}`);
  if (width || height) transforms.push(`c_${crop}`);
  if (crop === 'fill' && (width || height)) transforms.push(`g_${gravity}`);

  return `${CLOUDINARY_BASE_URL}/${transforms.join(',')}/${publicId}`;
}

/**
 * Précharge une image et résout uniquement si elle se charge avec succès.
 * Utilisé pour vérifier la présence réelle d'une image sur Cloudinary
 * avant de l'appliquer, afin de ne jamais afficher d'icône cassée.
 */
function probeImage(url) {
  return new Promise((resolve, reject) => {
    const probe = new Image();
    probe.onload = () => resolve(url);
    probe.onerror = () => reject(new Error('Image introuvable sur Cloudinary'));
    probe.src = url;
  });
}

/**
 * Calcule la largeur de livraison optimale pour un élément donné,
 * en fonction de sa taille réelle affichée et de la densité d'écran
 * du visiteur (Retina, etc.), plafonnée pour rester raisonnable.
 */
function computeOptimalWidth(el, fallbackWidth = 800) {
  const rect = el.getBoundingClientRect();
  const renderedWidth = Math.ceil(rect.width) || fallbackWidth;
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // plafonne à 2x
  return Math.min(Math.round(renderedWidth * dpr), 1920);
}

/**
 * Charge un unique élément [data-cld] : vérifie sa présence sur
 * Cloudinary puis l'applique (fond ou <img src>) si trouvée.
 * Marque l'élément comme "traité" pour ne jamais le requêter deux fois.
 * @param {HTMLElement} el
 * @returns {Promise<void>}
 */
function loadCldElement(el) {
  if (el.dataset.cldDone === 'true') return Promise.resolve();
  el.dataset.cldDone = 'true';

  const publicId = el.getAttribute('data-cld');
  if (!publicId) return Promise.resolve();

  const isImgTag = el.tagName === 'IMG';
  const fallbackWidth = parseInt(el.getAttribute('data-cld-w')) || (isImgTag ? el.naturalWidth : 800) || 800;
  const width = computeOptimalWidth(el, fallbackWidth);

  let height;
  const aspect = el.getAttribute('data-cld-ratio');
  if (aspect && aspect.includes('/')) {
    const [w, h] = aspect.split('/').map(Number);
    height = Math.round((width * h) / w);
  }

  const url = buildCloudinaryUrl(publicId, { width, height, crop: 'fill', gravity: 'auto' });

  return probeImage(url)
    .then((validUrl) => {
      if (isImgTag) {
        el.src = validUrl;
      } else {
        el.style.backgroundImage = `url("${validUrl}")`;
      }
      el.classList.add('cld-loaded');
    })
    .catch(() => {
      // Rien à faire : le repli local ou le placeholder déjà présent
      // dans le HTML reste affiché. Aucune icône cassée.
    });
}

/**
 * Initialise tous les emplacements d'image dynamiques de la page,
 * à l'EXCEPTION de ceux marqués data-cld-defer="true" (chargement
 * différé/à la demande, voir loadDeferredCldElements ci-dessous).
 */
function initCloudinaryImages() {
  document.querySelectorAll('[data-cld]').forEach((el) => {
    if (el.getAttribute('data-cld-defer') === 'true') return;
    loadCldElement(el);
  });
}

/**
 * Charge, après l'événement "load" de la page (donc sans jamais
 * concurrencer le chargement initial), tous les emplacements différés
 * qui n'ont pas vocation à être chargés "à la demande" par un script
 * de carrousel (ceux-ci appellent loadCldElement directement eux-mêmes).
 */
function loadDeferredCldElements() {
  document.querySelectorAll('[data-cld-defer="true"]:not([data-cld-oncarousel])').forEach((el) => {
    loadCldElement(el);
  });
}

// Lance l'initialisation une fois le DOM prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCloudinaryImages);
} else {
  initCloudinaryImages();
}

// Charge les images différées un court instant après le chargement complet
// de la page (laisse la priorité réseau aux ressources critiques).
window.addEventListener('load', () => {
  setTimeout(loadDeferredCldElements, 400);
});

// Expose les utilitaires pour réutilisation ailleurs dans le site
// (notamment js/hero-carousel.js pour le chargement à la demande).
window.cloudinaryHelper = { buildCloudinaryUrl, probeImage, computeOptimalWidth, loadCldElement };
