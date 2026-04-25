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

## À faire (Demandes utilisateur en attente)
- [ ] **Contenu** : Reprise manuelle des images de couverture et catégories des 40 articles importés.
- [ ] **SEO** : Vérification des Meta descriptions générées.
- [ ] **Performance** : Monitoring du `site-weight` via l'API GitHub.
