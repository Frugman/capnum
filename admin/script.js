/**
 * Logique d'administration et publication via GitHub API
 */

const GITHUB_CONFIG = {
    owner: 'FRUGMAN',
    repo: 'CAPNUM',
    branch: 'main'
};

document.addEventListener('DOMContentLoaded', () => {
    // Charger le token s'il existe
    const savedToken = localStorage.getItem('gh_token');
    const tokenInput = document.getElementById('github-token');
    
    if (savedToken) {
        tokenInput.value = savedToken;
        if (document.getElementById('manage-articles-list')) {
            loadAdminArticles();
        } else {
            checkForEditId();
        }
    }
    
    tokenInput.addEventListener('change', () => {
        localStorage.setItem('gh_token', tokenInput.value);
        if (document.getElementById('manage-articles-list')) {
            loadAdminArticles();
        } else {
            checkForEditId();
        }
    });

    // Gestion de l'image de couverture (seulement sur edit.html)
    const imgUpload = document.getElementById('image-upload');
    if (imgUpload) imgUpload.addEventListener('change', handleImageUpload);
    
    // Gestion des images dans le contenu (seulement sur edit.html)
    const contentImgUpload = document.getElementById('content-image-upload');
    if (contentImgUpload) contentImgUpload.addEventListener('change', handleContentImageUpload);

    // Publication (seulement sur edit.html)
    const btnPublish = document.getElementById('btn-publish');
    if (btnPublish) btnPublish.addEventListener('click', publishArticle);
});

async function checkForEditId() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    const token = document.getElementById('github-token').value;
    if (editId && token) {
        try {
            const { data } = await getGitHubFile('data/articles.json', token);
            const article = data.articles.find(a => a.id === editId);
            if (article) {
                document.getElementById('title').value = article.title;
                document.getElementById('category').value = article.category;
                document.getElementById('tags').value = article.tags.join(', ');
                document.getElementById('editor').innerHTML = article.content;
                showStatus("Article chargé. L'image n'est pas pré-chargée.", "success");
            }
        } catch (e) {
            showStatus("Impossible de charger l'article à éditer.", "error");
        }
    }
}


let coverImageBase64 = null;

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById('image-preview');
    
    // Options de compression
    const options = {
        maxSizeMB: 0.2, // 200Ko max pour rester low-tech
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp'
    };

    try {
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.src = event.target.result;
            preview.style.display = 'block';
            coverImageBase64 = event.target.result.split(',')[1];
        };
        reader.readAsDataURL(compressedFile);
    } catch (error) {
        console.error("Erreur compression:", error);
    }
}

async function handleContentImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const token = document.getElementById('github-token').value;
    if (!token) {
        alert("Veuillez d'abord saisir votre Token GitHub en bas de page.");
        return;
    }

    showStatus("Optimisation de l'image...", "");

    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };

    try {
        const compressedFile = await imageCompression(file, options);
        const fileName = `img_${Date.now()}.webp`;
        const path = `images/${fileName}`;

        // Lecture du fichier pour GitHub
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result.split(',')[1]; // Base64
            
            showStatus("Envoi sur GitHub...", "");
            
            // On envoie l'image directement sur GitHub
            await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Upload image: ${fileName}`, content: content })
            });

            // Insertion dans l'éditeur
            const imgUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/${path}`;
            document.execCommand('insertImage', false, imgUrl);
            
            showStatus("Image insérée !", "success");
        };
        reader.readAsDataURL(compressedFile);
    } catch (error) {
        showStatus("Erreur image: " + error.message, "error");
    }
}

async function publishArticle() {
    const token = document.getElementById('github-token').value;
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const tags = document.getElementById('tags').value.split(',').map(t => t.trim());
    const content = document.getElementById('editor').innerHTML;
    const status = document.getElementById('status');

    if (!token || !title || !content) {
        showStatus("Erreur : Token, titre et contenu obligatoires.", "error");
        return;
    }

    localStorage.setItem('gh_token', token);
    showStatus("Publication en cours (JSON + Image + HTML)...", "");

    const id = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]/g, '');
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    let finalImagePath = null;

    try {
        // 1. Envoyer l'image de couverture si elle existe
        if (coverImageBase64) {
            finalImagePath = `images/${id}-${timestamp}.webp`;
            const imgRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${finalImagePath}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Cover image: ${id}`, content: coverImageBase64 })
            });
            
            if (!imgRes.ok) {
                const errData = await imgRes.json();
                throw new Error("Erreur upload image: " + (errData.message || imgRes.statusText));
            }
        }

        // 2. Générer la page HTML de l'article
        const heroHtml = finalImagePath ? `<img src="../${finalImagePath}" class="article-hero-img">` : '';
        const articleHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | CAPNUM</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header class="site-header">
        <a href="../index.html" class="site-logo">CAPNUM</a>
        <div class="header-right">
            <nav class="main-nav">
                <a href="../index.html?cat=Environnement">🌱 Environnement</a>
                <a href="../index.html?cat=Data">📊 Data</a>
                <a href="../index.html?cat=IA">🤖 IA</a>
                <a href="../index.html?cat=Low Tech">⚙️ Low Tech</a>
                <a href="../index.html?cat=Solarpunk">☀️ Solarpunk</a>
                <a href="../index.html?cat=Dégafamisation">🌐 Dégafamisation</a>
            </nav>
            <label class="theme-switch" aria-label="Changer de thème">
                <input type="checkbox" id="theme-toggle-input" onchange="
                    let nt = this.checked ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', nt);
                    localStorage.setItem('theme', nt);
                ">
                <div class="slider round">
                    <svg class="icon sun-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    <svg class="icon moon-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </div>
            </label>
            <script>
                (function() {
                    let t = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    document.documentElement.setAttribute('data-theme', t);
                    document.getElementById('theme-toggle-input').checked = (t === 'dark');
                })();
            </script>
        </div>
    </header>
    <main class="article-full">
        <div class="card-meta" style="font-family: 'JetBrains Mono', monospace; color: var(--accent-color);">${category} • ${date}</div>
        <h1 style="font-size: 2.5rem; margin: 1rem 0 2rem 0;">${title}</h1>
        ${heroHtml}
        <div class="article-content">${content}</div>
    </main>
    <footer>
        <div id="site-info" style="font-size: 0.95rem; opacity: 0.9; text-align: justify; margin-bottom: 1.5rem; max-width: 900px; margin-left: auto; margin-right: auto;">
            <p>Ce blog est une expérimentation low-tech. Son poids total est de <strong><span id="site-weight">...</span> Ko</strong> (alors qu'une seule page web non-optimisée pèse souvent plus de 3 Mo !). En le fermant de 00h à 8h, on évite le trafic automatisé inutile la nuit tout en valorisant le droit humain à la déconnexion.</p>
            <script>
                (async function() {
                    const w = document.getElementById('site-weight');
                    const cached = localStorage.getItem('siteWeight');
                    if (cached) w.innerText = cached;
                    if (!cached || Date.now() - (localStorage.getItem('siteWeightTime') || 0) > 86400000) {
                        try {
                            const r = await fetch('https://api.github.com/repos/FRUGMAN/CAPNUM');
                            const d = await r.json();
                            if (d.size) {
                                w.innerText = d.size;
                                localStorage.setItem('siteWeight', d.size);
                                localStorage.setItem('siteWeightTime', Date.now());
                            }
                        } catch(e) {}
                    }
                })();
            </script>
        </div>
        <nav class="footer-links" style="text-align: center; padding-bottom: 2rem;">
            <a href="../admin/dashboard.html">Admin</a> • 
            <a href="../mentions-legales.html">Mentions légales</a> • 
            <a href="../random.html" id="link-random">RANDOM</a>
        </nav>
    </footer>
</body>
</html>`;

        let htmlSha;
        try {
            const { sha } = await getGitHubFile(`articles/${id}.html`, token);
            htmlSha = sha;
        } catch (e) {
            // Fichier n'existe pas, c'est normal
        }

        const htmlRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/articles/${id}.html`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: `Article HTML: ${id}`, 
                content: btoa(unescape(encodeURIComponent(articleHtml))),
                sha: htmlSha 
            })
        });

        if (!htmlRes.ok) {
            const errData = await htmlRes.json();
            throw new Error("Erreur génération HTML: " + (errData.message || htmlRes.statusText));
        }

        // 3. Mettre à jour articles.json
        const { sha, data } = await getGitHubFile('data/articles.json', token);
        const newArticle = { id, title, date, category, tags, image: finalImagePath || 'https://picsum.photos/400/200', content, views: 0, draft: false };
        
        // Eviter les doublons
        const index = data.articles.findIndex(a => a.id === id);
        if (index > -1) data.articles[index] = newArticle;
        else data.articles.unshift(newArticle);

        await updateGitHubFile('data/articles.json', JSON.stringify(data, null, 2), sha, token, `Update articles.json: ${title}`);

        showStatus("🚀 Article publié et page générée !", "success");
    } catch (error) {
        console.error(error);
        showStatus("Erreur : " + error.message, "error");
    }
}

async function getGitHubFile(path, token) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const resp = await fetch(url, {
        headers: { 'Authorization': `token ${token}` }
    });
    if (!resp.ok) throw new Error("Impossible de lire " + path);
    const json = await resp.json();
    // Décodage UTF-8 robuste
    const decoded = decodeURIComponent(escape(atob(json.content)));
    return {
        sha: json.sha,
        data: JSON.parse(decoded)
    };
}

async function updateGitHubFile(path, content, sha, token, message) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const resp = await fetch(url, {
        method: 'PUT',
        headers: { 
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha
        })
    });
    if (!resp.ok) throw new Error("Échec de la mise à jour GitHub");
}

function showStatus(msg, type) {
    const s = document.getElementById('status');
    s.innerText = msg;
    s.className = 'status-msg ' + type;
}

// ---- GESTION DES ARTICLES ----

async function loadAdminArticles() {
    const token = document.getElementById('github-token').value;
    if (!token) return;
    const listDiv = document.getElementById('manage-articles-list');
    listDiv.innerHTML = '<p>Chargement des articles...</p>';
    try {
        const { data } = await getGitHubFile('data/articles.json', token);
        if (!data.articles || data.articles.length === 0) {
            listDiv.innerHTML = '<p>Aucun article trouvé.</p>';
            return;
        }
        window.allAdminArticles = data.articles;
        listDiv.innerHTML = data.articles.map(a => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                <span>${a.title} <span style="opacity: 0.5;">(${a.date})</span></span>
                <div>
                    <button onclick="window.location.href='edit.html?id=${a.id}'" style="background:none; border:none; color:var(--accent-color); font-family: inherit; font-weight: bold; cursor:pointer;">Éditer</button>
                    <button onclick="deleteArticle('${a.id}')" style="background:none; border:none; color:#dc3545; font-family: inherit; font-weight: bold; cursor:pointer; margin-left: 10px;">Supprimer</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        listDiv.innerHTML = '<p style="color:#dc3545;">Erreur chargement. Ton token est-il valide ?</p>';
    }
}

window.deleteArticle = async function(id) {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    const token = document.getElementById('github-token').value;
    showStatus("Suppression en cours...", "");
    try {
        // 1. Mettre à jour JSON
        const { sha, data } = await getGitHubFile('data/articles.json', token);
        data.articles = data.articles.filter(a => a.id !== id);
        await updateGitHubFile('data/articles.json', JSON.stringify(data, null, 2), sha, token, `Delete article: ${id}`);
        
        // 2. Supprimer la page HTML
        try {
            const htmlData = await getGitHubFile(`articles/${id}.html`, token);
            await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/articles/${id}.html`, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Delete HTML: ${id}`, sha: htmlData.sha })
            });
        } catch(e) { console.log("HTML introuvable, skip"); }
        
        showStatus("Article supprimé avec succès !", "success");
        loadAdminArticles();
    } catch (e) {
        showStatus("Erreur suppression: " + e.message, "error");
    }
};
