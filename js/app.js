document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkOpeningHours();
    loadArticles();
});

function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        toggleBtn.innerText = currentTheme === 'dark' ? 'Mode Clair' : 'Mode Sombre';
    } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        toggleBtn.innerText = isDark ? 'Mode Clair' : 'Mode Sombre';
    }

    toggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (!theme) theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        toggleBtn.innerText = newTheme === 'dark' ? 'Mode Clair' : 'Mode Sombre';
    });
}

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
        card.innerHTML = `
            <img src="${article.image}" alt="${article.title}" class="card-image">
            <div class="card-content">
                <div class="card-meta">${article.category} • ${article.date}</div>
                <h3 class="card-title">${article.title}</h3>
                <p>${article.content.substring(0, 100).replace(/<[^>]*>/g, '')}...</p>
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

function checkOpeningHours() {
    const now = new Date();
    const hour = now.getUTCHours() + 2;
    const currentHour = hour >= 24 ? hour - 24 : hour;
    const isOpen = currentHour >= 8 && currentHour < 24;

    if (!isOpen) {
        document.body.insertAdjacentHTML('afterbegin', `
            <div id="closed-message" style="display: flex;">
                <h2>🌙 Le site se repose...</h2>
                <p>🌍 Ce blog est low-tech : il dort pour économiser l'énergie.<br>
                Ouverture de <strong>8h à 24h (UTC+2)</strong>.<br>
                Revenez nous voir demain !</p>
            </div>
        `);
    }
}

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
