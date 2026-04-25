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
    if (savedToken) document.getElementById('github-token').value = savedToken;

    // Gestion de l'image de couverture
    document.getElementById('image-upload').addEventListener('change', handleImageUpload);
    
    // Gestion des images dans le contenu
    document.getElementById('content-image-upload').addEventListener('change', handleContentImageUpload);

    // Publication
    document.getElementById('btn-publish').addEventListener('click', publishArticle);
});

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
    <header style="padding: 2rem; max-width: 900px; margin: auto;"><a href="../index.html" style="color: var(--accent-color); text-decoration: none; font-family: 'JetBrains Mono', monospace;">← Retour à l'accueil</a></header>
    <main class="article-full">
        <div class="card-meta" style="font-family: 'JetBrains Mono', monospace; color: var(--accent-color);">${category} • ${date}</div>
        <h1 style="font-size: 2.5rem; margin: 1rem 0 2rem 0;">${title}</h1>
        ${heroHtml}
        <div class="article-content">${content}</div>
    </main>
    <footer style="margin-top: 5rem; padding: 2rem; text-align: center; background: var(--footer-bg);"><p>Blog Capnum - 2026</p></footer>
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
