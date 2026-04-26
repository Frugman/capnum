document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
});

let allArticles = [];
let currentFilterMode = 'cat'; // 'cat' ou 'tag'
let currentFilter = 'all';

async function loadArticles() {
    try {
        const response = await fetch('data/articles.json');
        const data = await response.json();
        allArticles = data.articles;

        // Filtrage depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const cat = urlParams.get('cat');
        const tag = urlParams.get('tag');

        if (cat) {
            const btn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
            if (btn) {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            currentFilterMode = 'cat';
            currentFilter = cat;
        } else if (tag) {
            currentFilterMode = 'tag';
            currentFilter = tag;
        }

        renderGrid(allArticles, currentFilterMode, currentFilter);
        renderTags(allArticles);
    } catch (e) {
        console.error("Erreur chargement articles:", e);
        document.getElementById('articles-grid').innerHTML = "<p>Aucun article trouvé. Ajoute-en un !</p>";
    }
}

function renderGrid(articles, mode = 'cat', filter = 'all') {
    const grid = document.getElementById('articles-grid');
    grid.innerHTML = '';

    let filtered;
    if (mode === 'tag') {
        filtered = articles.filter(a => !a.draft && a.category !== 'RANDOM' && a.tags.includes(filter));
    } else if (filter === 'all') {
        filtered = articles.filter(a => !a.draft && a.category !== 'RANDOM');
    } else {
        filtered = articles.filter(a => !a.draft && a.category === filter);
    }

    filtered.slice(0, 5).forEach(article => {
        const card = document.createElement('a');
        card.href = `articles/${article.id}.html`;
        card.className = 'article-card';
        const formattedDate = article.date.split('-').reverse().join('/');
        const excerpt = article.content.replace(/<[^>]*>/g, '').substring(0, 120).trim() + '...';
        
        card.innerHTML = `
            <img src="${article.image}" alt="${article.title}" class="card-image">
            <div class="card-content">
                <h3 class="card-title">${article.title}</h3>
                <div class="card-excerpt">${excerpt}</div>
                <div class="card-meta">${article.category} • ${formattedDate}</div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Bouton "+" toujours en 6e position, lien selon le mode
    const more = document.createElement('a');
    more.className = 'article-card view-all-card';
    if (mode === 'tag') {
        more.href = `tag.html?tag=${encodeURIComponent(filter)}`;
    } else if (filter === 'all') {
        more.href = 'categorie.html';
    } else {
        more.href = `categorie.html?cat=${encodeURIComponent(filter)}`;
    }
    more.innerHTML = `
        <span class="view-all-plus">+</span>
        <span class="view-all-link">Voir les autres articles</span>
    `;
    grid.appendChild(more);
}

function renderTags(articles) {
    const container = document.querySelector('.tags-container');
    if (!container) return;

    // Compter les articles par tag (hors RANDOM et brouillons)
    const tagCount = {};
    articles.forEach(a => {
        if (a.category !== 'RANDOM' && !a.draft) {
            a.tags.forEach(t => {
                tagCount[t] = (tagCount[t] || 0) + 1;
            });
        }
    });

    // Trier par fréquence décroissante
    const sortedTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

    container.innerHTML = sortedTags.map(([t, count]) =>
        `<a href="#" class="tag" data-tag="${t}" onclick="filterByTag('${t}'); return false;">#${t}<sup style="font-size:0.7em; opacity:0.5; margin-left:2px;">${count}</sup></a>`
    ).join('');
}

window.filterByTag = function(tag) {
    // Désactiver les filtres catégorie
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    // Highlighter le tag actif
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
    const activeTag = document.querySelector(`.tag[data-tag="${tag}"]`);
    if (activeTag) activeTag.classList.add('active');

    currentFilterMode = 'tag';
    currentFilter = tag;
    renderGrid(allArticles, 'tag', tag);
};

// Filtrage par catégorie via les boutons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        currentFilterMode = 'cat';
        currentFilter = btn.dataset.filter;
        renderGrid(allArticles, 'cat', btn.dataset.filter);
    });
});
