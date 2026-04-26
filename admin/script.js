/**
 * Logique d'administration et publication via GitHub API
 */

const GITHUB_CONFIG = {
    owner: 'Frugman',
    repo: 'capnum',
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
        } else if (document.getElementById('title')) {
            checkForEditId();
        }
    }
    
    if (tokenInput) {
        tokenInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveToken();
        });
    }

    // Gestion de l'image de couverture (seulement sur edit.html)
    const imgUpload = document.getElementById('image-upload');
    if (imgUpload) imgUpload.addEventListener('change', handleImageUpload);
    
    // Gestion des images dans le contenu (seulement sur edit.html)
    const contentImgUpload = document.getElementById('content-image-upload');
    if (contentImgUpload) contentImgUpload.addEventListener('change', handleContentImageUpload);

    // Publication (seulement sur edit.html)
    const btnPublish = document.getElementById('btn-publish');
    if (btnPublish) {
        btnPublish.addEventListener('click', publishArticle);
        // Date du jour par défaut
        if (!new URLSearchParams(window.location.search).get('id') && document.getElementById('date')) {
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        }
    }
});

window.saveToken = function() {
    const tokenInput = document.getElementById('github-token');
    const token = tokenInput.value.trim();
    if (!token) {
        alert("Veuillez saisir un token.");
        return;
    }
    localStorage.setItem('gh_token', token);
    showStatus("Token enregistré localement ! Chargement des données...", "success");
    
    if (document.getElementById('manage-articles-list')) {
        loadAdminArticles();
    } else {
        checkForEditId();
    }
};

async function checkForEditId() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    const token = document.getElementById('github-token').value.trim();
    if (editId && token) {
        try {
            const { data } = await getGitHubFile('data/articles.json', token);
            const article = data.articles.find(a => a.id === editId);
            if (article) {
                window.currentEditingArticle = article; // Mémoriser l'article en cours
                document.getElementById('title').value = article.title;
                if (document.getElementById('date')) document.getElementById('date').value = article.date;
                document.getElementById('category').value = article.category;
                document.getElementById('tags').value = article.tags.join(', ');
                document.getElementById('editor').innerHTML = article.content;
                
                if (article.image) {
                    const preview = document.getElementById('image-preview');
                    if (preview) {
                        preview.src = article.image.startsWith('http') ? article.image : '../' + article.image;
                        preview.style.display = 'block';
                    }
                }
                showStatus("Article chargé.", "success");
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
        maxSizeMB: 0.1, // Réduit à 100Ko
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

    const token = document.getElementById('github-token').value.trim();
    if (!token) {
        alert("Veuillez d'abord saisir votre Token GitHub en bas de page.");
        return;
    }

    showStatus("Optimisation de l'image...", "");

    const options = { maxSizeMB: 0.15, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };

    try {
        const compressedFile = await imageCompression(file, options);
        const fileName = `img_${Date.now()}.webp`;
        const path = `images/${fileName}`;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result.split(',')[1];
            
            showStatus("Envoi sur GitHub...", "");
            
            await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Upload image: ${fileName}`, content: content })
            });

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
    const token = document.getElementById('github-token').value.trim();
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const tags = document.getElementById('tags').value.split(',').map(t => t.trim());
    let content = document.getElementById('editor').innerHTML;

    if (!token || !title || !content || !date) {
        showStatus("Erreur : Token, titre, date et contenu obligatoires.", "error");
        return;
    }

    // Automatisation des liens
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    tempDiv.querySelectorAll('a').forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
    content = tempDiv.innerHTML;

    localStorage.setItem('gh_token', token);
    showStatus("Publication en cours...", "");

    const id = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]/g, '');
    const timestamp = Date.now();
    let finalImagePath = null;

    try {
        if (coverImageBase64) {
            finalImagePath = `images/${id}-${timestamp}.webp`;
            await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${finalImagePath}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Cover image: ${id}`, content: coverImageBase64 })
            });
        }

        const existingImg = window.currentEditingArticle ? window.currentEditingArticle.image : 'https://picsum.photos/400/300';
        const finalImage = finalImagePath || existingImg;
        const formattedDate = date.split('-').reverse().join('/');

        // Template HTML de l'article
        const heroSrc = finalImage.startsWith('http') ? finalImage : '../' + finalImage;
        const articleHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | CAPNUM</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header class="site-header"></header>
    <main class="article-full">
        <div class="card-meta">${category} • ${formattedDate}</div>
        <h1>${title}</h1>
        <img src="${heroSrc}" class="article-hero-img">
        <div class="article-content">${content}</div>
    </main>
    <footer></footer>
    <script src="../js/common.js"></script>
</body>
</html>`;

        let htmlSha;
        try {
            const { sha } = await getGitHubFile(`articles/${id}.html`, token);
            htmlSha = sha;
        } catch (e) {}

        await updateGitHubFile(`articles/${id}.html`, articleHtml, htmlSha, token, `Article HTML: ${id}`);

        // Update articles.json
        const { sha, data } = await getGitHubFile('data/articles.json', token);
        const finalImageJson = finalImage.startsWith('../') ? finalImage.substring(3) : finalImage;
        const newArticle = { id, title, date, category, tags, image: finalImageJson, content, views: 0, draft: false };
        
        const index = data.articles.findIndex(a => a.id === id);
        if (index > -1) data.articles[index] = newArticle;
        else data.articles.unshift(newArticle);

        await updateGitHubFile('data/articles.json', JSON.stringify(data, null, 2), sha, token, `Update articles.json: ${title}`);

        showStatus("🚀 Article publié et page générée !", "success");
    } catch (error) {
        showStatus("Erreur : " + error.message, "error");
    }
}

/**
 * Encofage UTF-8 sûr pour GitHub
 */
function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

async function getGitHubFile(path, token) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const resp = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
    if (!resp.ok) throw new Error("Impossible de lire " + path);
    const json = await resp.json();
    const decoded = b64_to_utf8(json.content);
    
    let parsedData = null;
    if (path.endsWith('.json')) {
        try { parsedData = JSON.parse(decoded); } catch (e) {}
    }

    return { sha: json.sha, content: decoded, data: parsedData };
}

async function updateGitHubFile(path, content, sha, token, message) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: utf8_to_b64(content), sha })
    });
    if (!resp.ok) throw new Error("Échec de la mise à jour GitHub");
}

function showStatus(msg, type) {
    const s = document.getElementById('status');
    if (!s) return;
    s.innerText = msg;
    s.className = 'status-msg ' + type;
}

async function loadAdminArticles() {
    const token = document.getElementById('github-token').value.trim() || localStorage.getItem('gh_token');
    if (!token) return;
    const listDiv = document.getElementById('manage-articles-list');
    if (!listDiv) return;
    listDiv.innerHTML = '<p>Chargement...</p>';
    try {
        const { data } = await getGitHubFile('data/articles.json', token);
        
        // Déduplication par ID pour éviter les doublons à l'affichage
        const uniqueArticles = [];
        const seenIds = new Set();
        for (const a of data.articles) {
            if (!seenIds.has(a.id)) {
                seenIds.add(a.id);
                uniqueArticles.push(a);
            }
        }
        
        const sortedArticles = uniqueArticles.sort((a, b) => b.date.localeCompare(a.date));
        listDiv.innerHTML = sortedArticles.map(a => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0.5rem; border-bottom: 1px solid var(--border-color); gap: 1rem;">
                <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${a.title} <span style="opacity: 0.5; font-size: 0.8rem;">(${a.date})</span>
                </span>
                <div style="display: flex; gap: 15px;">
                    <button onclick="window.location.href='edit.html?id=${a.id}'" style="background:none; border:none; color:var(--accent-color); font-weight:bold; cursor:pointer;">Éditer</button>
                    <button onclick="deleteArticle('${a.id}')" style="background:none; border:none; color:#dc3545; font-weight:bold; cursor:pointer;">Supprimer</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        listDiv.innerHTML = '<p style="color:#dc3545;">Erreur. Token valide ?</p>';
    }
}

window.deleteArticle = async function(id) {
    if (!confirm("Supprimer cet article ?")) return;
    const token = document.getElementById('github-token').value.trim();
    try {
        const { sha, data } = await getGitHubFile('data/articles.json', token);
        data.articles = data.articles.filter(a => a.id !== id);
        await updateGitHubFile('data/articles.json', JSON.stringify(data, null, 2), sha, token, `Delete: ${id}`);
        loadAdminArticles();
    } catch (e) {}
};
