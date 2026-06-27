# FINAVIA — Catalogue des images Cloudinary

Ce document liste **tous les emplacements photo du site** et l'identifiant Cloudinary (`public_id`) exact que chaque image doit porter pour apparaître automatiquement au bon endroit — **sans aucune modification de code**.

## Comment ça marche

1. Connectez-vous à votre compte Cloudinary : [console.cloudinary.com](https://console.cloudinary.com)
2. Uploadez votre photo dans le dossier **`finavia/`**, en lui donnant **exactement** le nom indiqué dans la colonne *Identifiant* ci-dessous (sans l'extension — Cloudinary gère le format automatiquement).
3. Rechargez la page du site concernée : l'image apparaît immédiatement, optimisée et adaptée à chaque écran. Aucune action supplémentaire n'est nécessaire.
4. Tant qu'une image n'a pas été uploadée, son emplacement affiche un visuel "Image à venir" propre — jamais d'icône cassée.

> 💡 Vous pouvez aussi uploader vos images directement depuis l'espace admin du site (`/admin` → Médiathèque), qui les envoie automatiquement sur ce même compte Cloudinary.

## Recommandations techniques

- **Format source** : JPG ou PNG haute qualité (Cloudinary convertit automatiquement en WebP/AVIF selon le navigateur du visiteur — vous n'avez rien à faire).
- **Résolution conseillée** : uploadez vos photos dans leur meilleure résolution disponible (Cloudinary redimensionne automatiquement pour chaque écran) ; évitez simplement les fichiers de moins de 800 px de large.
- **Poids du fichier** : jusqu'à 5 Mo par image côté upload admin (au-delà, utilisez directement le tableau de bord Cloudinary, sans limite).
- **Cadrage** : respectez autant que possible le ratio indiqué pour chaque emplacement, pour un résultat net sans recadrage disgracieux (Cloudinary recadre intelligemment avec détection automatique du sujet si le ratio diffère légèrement).

---

## 1. Page d'accueil (`index.html`)

### Hero — vidéo cinématique (remplace l'ancien carrousel de fond)

| Emplacement | Identifiant Cloudinary | Format conseillé | Description |
|---|---|---|---|
| Vidéo principale du hero | `finavia/hero/video-main` | MP4, 16:9, 1920×1080 minimum | Vidéo sans son, en boucle. Scène de vie chaleureuse illustrant les services FINAVIA. Mouvement de caméra lent, couleurs chaudes. Jusqu'à ce que la vidéo soit uploadée, l'image de remplacement `assets/images/hero-bg-handshake.webp` s'affiche automatiquement via l'attribut `poster`. |

> 💡 **Upload vidéo** : connectez-vous à [console.cloudinary.com](https://console.cloudinary.com), uploadez votre vidéo dans le dossier `finavia/hero/` sous le nom `video-main`. Le site la détecte automatiquement au prochain chargement de page.

### Autres visuels de la page d'accueil

| Emplacement | Identifiant Cloudinary | Ratio conseillé | Description |
|---|---|---|---|
| Vignette "Conseillers" | `finavia/showcase-advisor` | 10:7 | Section "Des conseillers à votre écoute". Une photo de remplacement est déjà en place. |
| Vignette "Propriétaires" | `finavia/showcase-homeowners` | 10:7 | Section "Réalisez vos projets de vie". Une photo de remplacement est déjà en place. |
| Galerie — grande photo 1 | `finavia/gallery/1` | 4:3 | Premier visuel large de la mosaïque "FINAVIA en images" (ex : bureaux). |
| Galerie — photo 2 | `finavia/gallery/2` | Carré (1:1) | Mosaïque — ex : équipe. |
| Galerie — photo 3 | `finavia/gallery/3` | Carré (1:1) | Mosaïque — ex : client. |
| Galerie — photo 4 | `finavia/gallery/4` | Carré (1:1) | Mosaïque — ex : projet financé. |
| Galerie — grande photo 5 | `finavia/gallery/5` | 4:3 | Mosaïque — ex : conseil client. |
| Galerie — photo 6 | `finavia/gallery/6` | Carré (1:1) | Mosaïque — ex : vie d'agence. |

## 2. Nos Prêts (`nos-prets.html`)

| Emplacement | Identifiant Cloudinary | Ratio conseillé |
|---|---|---|
| Prêt Personnel | `finavia/loans/personal` | 10:7 |
| Prêt Automobile | `finavia/loans/auto` | 10:7 |
| Prêt Travaux | `finavia/loans/travaux` | 10:7 |
| Prêt Immobilier | `finavia/loans/immo` | 10:7 |
| Regroupement de Crédits | `finavia/loans/regroupement` | 10:7 |

## 3. Comment ça marche (`comment-ca-marche.html`)

| Emplacement | Identifiant Cloudinary | Ratio conseillé |
|---|---|---|
| Étape 1 — Demande en ligne | `finavia/process/step1` | 16:9 |
| Étape 2 — Analyse du dossier | `finavia/process/step2` | 16:9 |
| Étape 3 — Proposition | `finavia/process/step3` | 16:9 |
| Étape 4 — Déblocage des fonds | `finavia/process/step4` | 16:9 |

## 4. À Propos (`a-propos.html`)

| Emplacement | Identifiant Cloudinary | Ratio conseillé |
|---|---|---|
| Photo "Notre histoire" | `finavia/about/story` | Portrait (8:9) — une photo de remplacement est déjà en place |
| Portrait — Sophie Martin (CEO) | `finavia/team/sophie-martin` | Carré (1:1), cadrage visage centré |
| Portrait — Marc Leroy | `finavia/team/marc-leroy` | Carré (1:1) |
| Portrait — Ana Fernandez | `finavia/team/ana-fernandez` | Carré (1:1) |
| Portrait — Thomas Berger | `finavia/team/thomas-berger` | Carré (1:1) |
| Bureau Paris | `finavia/office/paris` | Carré (1:1) |
| Bureau Madrid | `finavia/office/madrid` | Carré (1:1) |
| Bureau Berlin | `finavia/office/berlin` | Carré (1:1) |
| Équipe au travail | `finavia/office/team-work` | Carré (1:1) |

> Tant qu'un portrait d'équipe n'est pas uploadé, les initiales colorées actuelles restent affichées (aucune icône cassée).

## 5. Contact (`contact.html`)

| Emplacement | Identifiant Cloudinary | Ratio conseillé |
|---|---|---|
| Photo de l'agence | `finavia/contact/office` | 16:9 |

---

## Ajouter un nouvel emplacement d'image (pour un développeur)

Pour ajouter un nouvel emplacement géré par Cloudinary ailleurs sur le site :

```html
<div class="cld-photo" data-cld="finavia/dossier/nom" data-cld-w="800" style="--cld-ratio:4/3;" role="img" aria-label="Description de l'image">
  <div class="cld-photo-placeholder">
    <span class="cld-photo-placeholder-icon">🖼️</span>
    <span class="cld-photo-placeholder-text">Image à venir</span>
  </div>
</div>
```

Le script `js/cloudinary.js` détecte automatiquement tout élément portant l'attribut `data-cld` et gère l'affichage progressif (placeholder → photo réelle dès qu'elle est détectée sur Cloudinary), sans configuration supplémentaire.
