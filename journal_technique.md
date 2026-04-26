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

## 2026-04-25 - Étape 4 : Migration WordPress & Administration
- **Migration WP** : 
    - Tentative d'import complet (XML) via PowerShell.
    - **Rétropédalage** : Problèmes d'encodage (UTF-8) et de layout. Reset complet vers une base saine.
    - **Import Minimal** : Migration réussie de 40 articles (texte uniquement). Nettoyage strict du HTML WordPress pour ne garder que le texte brut et le formatage de base (bold, links, h2/h3). Suppression de toutes les images pour une reprise manuelle propre.
- **Admin Dashboard** : 
    - Ajout de la liste des articles avec fonctions **Éditer** et **Supprimer**.
    - Tri automatique du plus récent au plus ancien.
    - Optimisation UI : Titres longs tronqués proprement, boutons fixes à droite, conteneur élargi.
- **Bug Fixes** :
    - Correction de l'erreur "SHA missing" lors de l'édition (distinction fichiers JSON/HTML).
    - Correction du `NetworkError` lié au renommage du dépôt GitHub (`Frugman/capnum`).
    - Ajout du support pour conserver l'image de couverture existante lors d'une édition.
    - Encodage forcé en UTF-8 sans BOM sur tous les scripts de génération.

## Étape 5 : Personnalisation Visuelle et Expériences Rétro (25/04/2026)
*   **Identité Visuelle** : Adoption d'une palette "Solarpunk" personnalisée.
    *   Dark Mode : Vert électrique `#00ff93`.
    *   Light Mode : Vert forêt `#009556`.
    *   Application systématique aux titres, liens et boutons.
*   **Optimisation Grid** : 
    *   Cartes d'articles à hauteur égale via Flexbox.
    *   Réorganisation de la structure : Titre (1.1rem) > Extrait (120 chars) > Metas (Catégorie + Date) en bas.
*   **Page RANDOM (TO8 Edition)** :
    *   Refonte totale inspirée de l'ordinateur Thomson TO8.
    *   Utilisation de la police pixelisée `VT323` et couleurs d'origine.
    *   Intégration d'un mini-jeu de **Tic-Tac-Toe** (Morpion) contre l'ordinateur.
    *   Easter Eggs : Référence "WarGames" (Guerre thermo-nucléaire) et date système figée en octobre 1991.
*   **Stabilisation Technique** :
    *   **Bouton Token** : Ajout d'une validation manuelle du token GitHub dans l'admin.
    *   **Correctif UTF-8** : Implémentation de `utf8_to_b64` et `b64_to_utf8` pour garantir l'intégrité des accents et emojis lors des appels API GitHub.
    *   **Horaires Low-Tech** : Blocage automatique de l'accès au site entre 00h et 08h (UTC+2) pour promouvoir la déconnexion et l'économie d'énergie.

---
*Note : Le site est maintenant prêt pour la reprise éditoriale manuelle des 40 articles importés.*

## À faire (Demandes utilisateur en attente)
- [ ] **Contenu** : Reprise manuelle des images de couverture et catégories des 40 articles importés.
- [ ] **SEO** : Vérification des Meta descriptions générées.
- [ ] **Performance** : Monitoring du `site-weight` via l'API GitHub.
