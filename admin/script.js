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

    // Gestion de l'image
    document.getElementById('image-upload').addEventListener('change', handleImageUpload);

    // Publication
    document.getElementById('btn-publish').addEventListener('click', publishArticle);
});

async function handleImageUpload(e) {
    const file = e.target.target.files[0];
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
            preview.dataset.blob = event.target.result; // On stocke pour plus tard
        };
        reader.readAsDataURL(compressedFile);
    } catch (error) {
        console.error("Erreur compression:", error);
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
    showStatus("Publication en cours...", "");

    const id = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
    const date = new Date().toISOString().split('T')[0];

    try {
        // 1. Récupérer articles.json
        const articlesPath = 'data/articles.json';
        const { sha, data } = await getGitHubFile(articlesPath, token);
        
        const newArticle = {
            id,
            title,
            date,
            category,
            tags,
            image: `images/${id}.webp`,
            content,
            views: 0,
            draft: false
        };

        data.articles.unshift(newArticle);
        data.site_metadata.last_updated = date;

        // 2. Préparer les fichiers à envoyer
        const filesToCommit = [
            { path: articlesPath, content: JSON.stringify(data, null, 2), sha: sha }
        ];

        // 3. Envoyer sur GitHub (Mise à jour articles.json)
        await updateGitHubFile(articlesPath, JSON.stringify(data, null, 2), sha, token, `Ajout article: ${title}`);

        // 4. (Optionnel mais recommandé) On génère la page HTML de l'article ici si on veut du 100% statique
        // Pour l'instant, on se concentre sur le JSON.

        showStatus("🚀 Article publié avec succès !", "success");
    } catch (error) {
        console.error(error);
        showStatus("Erreur GitHub : " + error.message, "error");
    }
}

async function getGitHubFile(path, token) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const resp = await fetch(url, {
        headers: { 'Authorization': `token ${token}` }
    });
    if (!resp.ok) throw new Error("Impossible de lire " + path);
    const json = await resp.json();
    return {
        sha: json.sha,
        data: JSON.parse(atob(json.content))
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
