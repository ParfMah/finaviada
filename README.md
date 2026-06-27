# FINAVIA – Frontend

Plateforme web de prêt financier professionnelle. Ce dossier contient l'intégralité du frontend : HTML5, CSS3 et JavaScript Vanilla (aucun framework). Le site est multilingue (FR/ES/DE/PT/IT), entièrement responsive, et inclut un espace d'administration (CMS) côté client.

## 1. Structure du projet

```
frontend/
├── index.html                 Page d'accueil
├── nos-prets.html              Détail des 5 types de prêts
├── comment-ca-marche.html      Processus en 4 étapes
├── a-propos.html                Histoire, mission, valeurs, équipe
├── contact.html                 Formulaire de contact + coordonnées
├── demande-de-pret.html         Formulaire de demande multi-étapes
├── robots.txt
├── sitemap.xml
├── admin/
│   ├── index.html               Page de connexion admin
│   └── dashboard.html           Tableau de bord (CMS, demandes, emails...)
├── css/
│   ├── main.css                 Design system + composants
│   ├── animations.css           Keyframes et transitions
│   ├── responsive.css           Media queries (toutes langues)
│   └── admin.css                Styles de l'espace admin
├── js/
│   ├── i18n.js                   Système de traduction (5 langues)
│   ├── main.js                   Navigation, header, FAQ, newsletter
│   ├── animations.js             Scroll reveal, compteurs animés
│   ├── form.js                   Formulaire multi-étapes + validation
│   └── admin.js                  Logique du tableau de bord admin
└── assets/
    └── favicon.svg
```

## 2. Installation

Aucune dépendance ni build n'est nécessaire : le site fonctionne directement dans le navigateur.

**Option A — Ouverture directe**
Ouvrez `index.html` dans votre navigateur (double-clic). Fonctionne pour une consultation rapide, mais certaines fonctionnalités (fetch vers une API) nécessitent un serveur local.

**Option B — Serveur local recommandé**
```bash
# Avec Python 3
cd frontend
python3 -m http.server 8080

# Avec Node.js (http-server)
npx http-server frontend -p 8080
```
Puis ouvrez `http://localhost:8080`.

## 3. Connexion au backend

Le frontend appelle une API backend Express.js (livrée séparément) pour : l'envoi des formulaires (contact, demande de prêt), le CMS (textes, services, images), l'authentification admin et l'envoi d'emails.

L'URL de l'API est configurée via la variable globale `window.FINAVIA_API`, définie en bas de chaque page admin :
```html
<script>
  window.FINAVIA_API = 'https://votre-backend.onrender.com';
</script>
```
Pour le site public, les formulaires (`js/form.js`) utilisent la même variable si elle existe, sinon ils fonctionnent en **mode démo** (simulation sans serveur), ce qui permet de tester l'interface sans backend connecté.

## 4. Système multilingue (i18n)

Toute la traduction est centralisée dans `js/i18n.js`. Chaque texte traduisible porte un attribut :
```html
<h1 data-i18n="hero.title">Texte par défaut (français)</h1>
<input data-i18n-placeholder="form.ph.email" placeholder="...">
<option data-i18n-option="country.fr">France</option>
```

**Pour ajouter ou modifier une traduction :**
1. Ouvrez `js/i18n.js`.
2. Repérez l'objet `translations`, qui contient une clé par langue (`fr`, `es`, `de`, `pt`, `it`).
3. Ajoutez/modifiez la clé recherchée dans chaque langue concernée (la langue française sert de fallback si une clé manque ailleurs).
4. Aucune compilation n'est nécessaire ; rechargez simplement la page.

**Pour ajouter une nouvelle langue :**
1. Dupliquez un bloc de langue existant dans l'objet `translations` (ex: copiez `es: {...}` et nommez-le avec le nouveau code, ex `nl`).
2. Traduisez toutes les clés.
3. Ajoutez l'entrée correspondante dans `langData` (drapeau, code, nom).
4. Ajoutez un bouton `<button class="lang-option" data-lang="nl">🇳🇱 Nederlands</button>` dans le dropdown de chaque page HTML, ainsi qu'un bouton équivalent dans `.mobile-lang-grid`.

La langue choisie est sauvegardée en `localStorage` et restaurée à la prochaine visite. Si aucune préférence n'existe, le système tente de détecter la langue du navigateur.

## 5. Responsive design

Le site a été conçu pour rester parfaitement lisible dans les 5 langues, y compris l'allemand (mots longs) et le portugais. Techniques utilisées :
- `clamp()` pour les tailles de police et espacements fluides.
- `hyphens: auto` et `overflow-wrap: break-word` sur tous les textes.
- `min-width: 0` sur les éléments de grilles/flexbox pour éviter les débordements.
- Règles spécifiques `:lang(de)` dans `css/responsive.css` pour réduire légèrement la taille de la navigation en allemand.
- Tests visuels recommandés : 1920px, 1440px, 1024px (tablette paysage), 768px (tablette portrait), 414px (mobile large), 360px (petit mobile).

Pour tester le rendu dans une langue donnée sans changer son navigateur, ouvrez la console et tapez :
```js
i18n.setLanguage('de'); // ou 'es', 'pt', 'it', 'fr'
```

## 6. Menu mobile

Le menu mobile (hamburger) glisse depuis la droite avec une animation fluide (`transform: translateX`). Il se ferme via la croix, un clic sur l'overlay, la touche `Échap`, ou la sélection d'un lien. Le code est dans `js/main.js → initMobileMenu()` et les styles dans `css/main.css` (section "Menu mobile").

## 7. Formulaire de demande de prêt (multi-étapes)

Le fichier `demande-de-pret.html` contient un formulaire en 4 étapes (Identité → Finances → Projet → Confirmation), géré par `js/form.js` :
- Validation en temps réel (email, téléphone, montants).
- Sauvegarde automatique dans `localStorage` (clé `finavia_form_draft`) pour permettre la reprise en cas d'abandon — utile pour le système de relance par email côté backend.
- Récapitulatif avant soumission.
- Envoi vers `POST {FINAVIA_API}/api/loan-requests` si un backend est connecté, sinon simulation locale.

## 8. Espace administrateur (CMS)

Accessible via `/admin/index.html`. En **mode démo** (sans backend connecté), utilisez :
```
Email :        admin@finavia.eu
Mot de passe : Admin@2024!
```
Le tableau de bord (`admin/dashboard.html`) propose : vue d'ensemble (statistiques), gestion des demandes clients (filtrage, statuts), édition de contenu (textes, FAQ), gestion des services/prêts, médiathèque (upload d'images), et configuration des emails automatiques. Toute la logique de rendu dynamique se trouve dans `js/admin.js` (fonctions `renderOverview()`, `renderRequests()`, etc.).

Une fois le backend connecté, remplacez les données simulées (`getMockRequests()`, `getMockStats()`, etc. dans `js/admin.js`) par les appels API réels déjà préparés (`apiGet()`).

## 9. Personnalisation

**Couleurs et design system** : toutes les variables (couleurs, espacements, typographies, rayons, ombres) sont centralisées en haut de `css/main.css` dans le bloc `:root`. Modifier une variable met à jour tout le site.

**Polices** : Plus Jakarta Sans (titres) et Inter (texte courant), chargées depuis Google Fonts dans le `<head>` de chaque page.

**Logo** : actuellement une lettre "F" stylisée (`.logo-icon`). Remplacez par votre propre SVG/image dans chaque en-tête de page, ou modifiez `assets/favicon.svg`.

## 10. Images dynamiques via Cloudinary

Le site intègre nativement **Cloudinary** pour la gestion des photos : la quasi-totalité des emplacements visuels (hero, services, équipe, bureaux, étapes du processus, galerie...) affichent automatiquement une image dès qu'elle est uploadée sur votre compte Cloudinary, **sans aucune modification de code ni redéploiement**.

**Pour ajouter vos photos :**
1. Consultez le fichier **[`CLOUDINARY-IMAGES.md`](./CLOUDINARY-IMAGES.md)** à la racine de ce dossier : il liste précisément chaque emplacement du site et l'identifiant exact (`public_id`) que doit porter votre image.
2. Uploadez vos photos sur [console.cloudinary.com](https://console.cloudinary.com), dans le dossier `finavia/`, en respectant ces identifiants.
3. Rechargez la page concernée : la photo apparaît immédiatement, optimisée (format et qualité automatiques) et adaptée à chaque taille d'écran.

**Fonctionnement technique** (voir `js/cloudinary.js`) :
- Chaque emplacement porte un attribut `data-cld="finavia/dossier/nom"`.
- Au chargement, le script vérifie si une image existe réellement à cet identifiant. Si oui, elle s'affiche (avec un léger fondu) ; si non, un visuel "Image à venir" reste affiché — jamais d'icône cassée.
- Les URLs générées utilisent `f_auto,q_auto` (format et compression automatiquement optimaux selon le navigateur du visiteur) et une largeur calculée selon la taille réelle d'affichage × la densité d'écran, pour ne jamais charger plus lourd que nécessaire. C'est un point clé pour la vitesse de chargement et donc pour le **référencement (SEO)**.
- Seul le nom du compte Cloudinary (`cloud_name`, qui n'est pas une donnée secrète) est présent côté frontend. Les clés d'API sensibles ne sont utilisées que côté backend (voir le README du dossier `backend/`), pour les uploads réalisés depuis l'espace admin du site.

Les 3 photos déjà intégrées (fond du hero, sections vedettes de la page d'accueil) continuent de s'afficher normalement même sans connexion à Cloudinary : elles servent de repli local et seront remplacées dès que vous uploadez une image au même identifiant.

## 11. SEO

Chaque page possède : balises `title` et `meta description` uniques, structure de titres H1–H3 cohérente, attributs `alt` sur les images, et un balisage Schema.org (`FinancialService`) sur la page d'accueil. Les fichiers `robots.txt` et `sitemap.xml` sont fournis à la racine et doivent être mis à jour si de nouvelles pages sont ajoutées.

## 12. Déploiement sur Render

Le frontend est un site statique : aucun serveur Node.js n'est nécessaire pour l'héberger.

**Étapes pour déployer sur Render :**

1. Créez un dépôt Git (GitHub/GitLab) contenant ce dossier `frontend/`.
2. Connectez-vous sur [render.com](https://render.com) et cliquez sur **New +** → **Static Site**.
3. Reliez votre dépôt Git.
4. Configurez :
   - **Build Command** : laissez vide (aucun build requis).
   - **Publish directory** : `frontend` (ou `.` si le dépôt ne contient que ce dossier).
5. Cliquez sur **Create Static Site**. Render génère une URL du type `https://finavia-frontend.onrender.com`.
6. Une fois le backend déployé (voir le README du dossier `backend/`), mettez à jour la variable `window.FINAVIA_API` dans `admin/index.html`, `admin/dashboard.html`, et le cas échéant dans les pages publiques, avec l'URL réelle du backend Render (ex: `https://finavia-backend.onrender.com`).
7. (Optionnel) Configurez un nom de domaine personnalisé dans les paramètres Render du site statique, puis pointez vos DNS vers Render.

Le site se redéploie automatiquement à chaque `push` sur la branche configurée.

## 13. Notes techniques importantes

- Aucune dépendance externe hormis Google Fonts (CDN). Aucun `node_modules` n'est requis pour le frontend.
- Toutes les requêtes vers le backend utilisent `fetch()` natif ; en cas d'échec (backend non démarré), le site bascule en mode démonstration pour ne jamais bloquer l'utilisateur.
- Le stockage local (`localStorage`) est utilisé uniquement pour : préférence de langue, brouillon de formulaire (abandon tracking), token d'authentification admin. Aucune donnée sensible n'y est stockée en clair côté production — le token JWT réel doit être émis par le backend.
