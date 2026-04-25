document.addEventListener('DOMContentLoaded', () => {
    checkOpeningHours();
    loadArticles();
});

async function loadArticles() {
    try {
        const response = await fetch('data/articles.json');
        const data = await response.json();
        renderGrid(data.articles);
        renderTags(data.articles);
    } catch (e) {
        console.error("Erreur chargement articles:", e);
        document.getElementById('articles-grid').innerHTML = "<p>Aucun article trouvé. Ajoute-en un !</p>";
    }
}

function renderGrid(articles, filter = 'all') {
    const grid = document.getElementById('articles-grid');
    grid.innerHTML = '';

    const filtered = filter === 'all' 
        ? articles.filter(a => !a.draft && a.category !== 'RANDOM')
        : articles.filter(a => !a.draft && a.category === filter);

    const limit = 5;
    const toShow = filtered.slice(0, limit);

    toShow.forEach(article => {
        const card = document.createElement('a');
        card.href = `articles/${article.id}.html`;
        card.className = 'article-card';
        card.innerHTML = `
            <img src="${article.image.startsWith('http') ? article.image : article.image}" alt="${article.title}" class="card-image">
            <div class="card-content">
                <div class="card-meta">${article.category} • ${article.date}</div>
                <h3 class="card-title">${article.title}</h3>
                <p>${article.content.substring(0, 100).replace(/<[^>]*>/g, '')}...</p>
            </div>
        `;
        grid.appendChild(card);
    });

    if (filtered.length > limit) {
        const more = document.createElement('a');
        more.className = 'article-card view-all-card';
        more.href = `categories/${filter.toLowerCase()}.html`;
        more.innerHTML = `<span class="view-all-link">VOIR TOUT →</span>`;
        grid.appendChild(more);
    }
}

let allArticles = [];

async function loadArticles() {
    try {
        const response = await fetch('data/articles.json');
        const data = await response.json();
        allArticles = data.articles;
        renderGrid(allArticles);
        renderTags(allArticles);
    } catch (e) {
        console.error("Erreur chargement articles:", e);
        document.getElementById('articles-grid').innerHTML = "<p>Aucun article trouvé. Ajoute-en un !</p>";
    }
}

// Logique de filtrage
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGrid(allArticles, btn.dataset.filter);
    });
});
