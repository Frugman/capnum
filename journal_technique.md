# Journal Technique - Projet CAPNUM

## 2026-04-25 - Initialisation
- **Structure** : Création des dossiers `/data`, `/css`, `/js`, `/articles`, `/categories`, `/admin`, `/images`.
- **Data** : `articles.json` initialisé avec catégories (Environnement, Data, IA, Low Tech, Solarpunk, Dégafamisation).
- **Core** : `index.html` (squelette) + `style.css` (variables root, layout de base).
- **UX** : `app.js` implémenté avec logique "Site dort" (8h-24h UTC+2).
- **SEO/Hosting** : `CNAME` (capnum.io) et `.htaccess` (www redirect) créés.
- **Décision** : Abandon du compteur de vues (simplification).
- **Workflow** : Préparation pour édition via GitHub API (token).

## 2026-04-25 - Étape 2 : Design & UX
- **Design** : Mise en place d'un thème premium (Polices : Outfit & JetBrains Mono).
- **Responsive** : Grille adaptative et boutons de catégories avec emojis.
- **Dark Mode** : Support natif via `prefers-color-scheme`.
- **JS** : Implémentation du chargement dynamique des articles et du nuage de tags (basé sur `articles.json`).
- **Placeholder** : Utilisation de Dicebear pour l'avatar et Picsum pour les images par défaut.

## 2026-04-25 - Étape 3 : Synchronisation GitHub
- **Git** : Initialisation locale et premier commit.
- **GitHub** : Création du dépôt `FRUGMAN/CAPNUM` et push (forcé pour nettoyer le remote).
- **GitHub Pages** : Configuration en cours.
- **Admin** : `admin/script.js` configuré pour l'utilisateur `FRUGMAN`.
