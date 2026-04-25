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
        const card = document.createElement('div');
        card.className = 'article-card';
        card.innerHTML = `
            <img src="${article.image || 'https://picsum.photos/400/200'}" alt="${article.title}" class="card-image">
            <div class="card-content">
                <div class="card-meta">${article.category} • ${article.date}</div>
                <h3 class="card-title">${article.title}</h3>
                <p>${article.content.substring(0, 100).replace(/<[^>]*>/g, '')}...</p>
            </div>
        `;
        grid.appendChild(card);
    });

    if (filtered.length > limit) {
        const more = document.createElement('div');
        more.className = 'article-card view-all-card';
        more.innerHTML = `<a href="categories/${filter.toLowerCase()}.html" class="view-all-link">VOIR TOUT →</a>`;
        grid.appendChild(more);
    }
}

function renderTags(articles) {
    const container = document.querySelector('.tags-container');
    const tags = new Set();
    articles.forEach(a => {
        if (a.category !== 'RANDOM') a.tags.forEach(t => tags.add(t));
    });
    
    container.innerHTML = Array.from(tags).map(t => `<a href="#" class="tag">#${t}</a>`).join('');
}

function checkOpeningHours() {
    const now = new Date();
    const hour = now.getUTCHours() + 2; 
    const currentHour = hour >= 24 ? hour - 24 : hour;
    const isOpen = currentHour >= 8 && currentHour < 24;

    if (!isOpen) {
        document.body.insertAdjacentHTML('afterbegin', `
            <div id="closed-message" style="display: flex;">
                <h2>🌙 Le site se repose...</h2>
                <p>🌍 Ce blog est low-tech : il dort pour économiser l’énergie.<br>
                Ouverture de <strong>8h à 24h (UTC+2)</strong>.<br>
                Revenez nous voir demain !</p>
            </div>
        `);
    }
}

// Logique de filtrage
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Ici on re-chargerait ou filtrerait
        // simulation
    });
});
