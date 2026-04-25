# Script d'import WordPress -> CAPNUM (Version MINIMALE & PROPRE)
$ErrorActionPreference = "Stop"
$baseDir  = "e:\LOGICIELS\CAPNUM"
$xmlFile  = Join-Path $baseDir "dataenvironnementiaenvende.WordPress.2026-04-25.xml"
$jsonFile = Join-Path $baseDir "data\articles.json"
$artDir   = Join-Path $baseDir "articles"

function Write-Utf8File($path, $content) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllLines($path, $content, $utf8NoBom)
}

Write-Host "Lecture du XML..."
$raw = [System.IO.File]::ReadAllText($xmlFile, [System.Text.Encoding]::UTF8)
$itemMatches = [regex]::Matches($raw, '<item>([\s\S]*?)</item>')

$articles = New-Object System.Collections.Generic.List[object]

foreach ($itemMatch in $itemMatches) {
    $item = $itemMatch.Groups[1].Value
    
    # Uniquement les articles publiés
    if ($item -match '<wp:post_type[^>]*><!\[CDATA\[post\]\]></wp:post_type>' -and $item -match '<wp:status[^>]*><!\[CDATA\[publish\]\]></wp:status>') {
        
        # Titre
        $title = ""
        if ($item -match '<title><!\[CDATA\[([\s\S]*?)\]\]></title>') { $title = $Matches[1] }
        elseif ($item -match '<title>([\s\S]*?)</title>') { $title = $Matches[1] }

        # Slug
        $slug = ""
        if ($item -match '<wp:post_name><!\[CDATA\[([\s\S]*?)\]\]></wp:post_name>') { $slug = $Matches[1] }
        if (-not $slug) { $slug = $title.ToLower() -replace '[^a-z0-9]+','-' -replace '^-+|-+$','' }

        # Date
        $date = "2024-01-01"
        if ($item -match '<wp:post_date_gmt><!\[CDATA\[(\d{4}-\d{2}-\d{2})') { $date = $Matches[1] }

        # Contenu
        $content = ""
        if ($item -match '<content:encoded><!\[CDATA\[([\s\S]*?)\]\]></content:encoded>') { $content = $Matches[1] }

        # --- NETTOYAGE STRICT DU CONTENU ---
        # 1. Supprimer TOUTES les images
        $content = [regex]::Replace($content, '<img[^>]*>', '')
        $content = [regex]::Replace($content, '<figure[^>]*>([\s\S]*?)</figure>', '$1')
        
        # 2. Supprimer les balises WordPress spécifiques et commentaires
        $content = [regex]::Replace($content, '<!-- [\s\S]*? -->', '')
        
        # 3. Ne garder que : p, b, strong, i, em, a, h2, h3
        # On remplace les autres balises par des <p> pour la sécurité
        $content = [regex]::Replace($content, '<(blockquote|div|section|aside|span|ul|ol|li)[^>]*>', '<p>')
        $content = [regex]::Replace($content, '</(blockquote|div|section|aside|span|ul|ol|li)>', '</p>')
        
        # 4. Nettoyage final (classes, styles, etc.)
        $content = [regex]::Replace($content, '\s+(class|style|id|data-[a-z-]+)="[^"]*"', '', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        $content = [regex]::Replace($content, '<p>\s*</p>', '') # Supprimer paragraphes vides

        # Génération du HTML (Template minimal)
        $html = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title | CAPNUM</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header class="site-header">
        <a href="../index.html" class="site-logo">CAPNUM</a>
        <div class="header-right">
            <nav class="main-nav">
                <a href="../categorie.html?cat=Environnement">🌱 Environnement</a>
                <a href="../categorie.html?cat=Data">📊 Data</a>
                <a href="../categorie.html?cat=IA">🤖 IA</a>
                <a href="../categorie.html?cat=Low Tech">⚙️ Low Tech</a>
                <a href="../categorie.html?cat=Solarpunk">☀️ Solarpunk</a>
                <a href="../categorie.html?cat=Dégafamisation">🌐 Dégafamisation</a>
            </nav>
        </div>
    </header>

    <main>
        <article class="article-full">
            <p style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;opacity:0.7;margin-bottom:0.5rem;">
                <a href="../index.html">← Accueil</a> &nbsp;|&nbsp; Non classé &nbsp;|&nbsp; $date
            </p>
            <h1>$title</h1>
            <div class="article-content">
                $content
            </div>
        </article>
    </main>

    <footer>
        <div id="site-info" style="font-size:0.95rem;opacity:0.9;text-align:justify;margin-bottom:1.5rem;max-width:900px;margin-left:auto;margin-right:auto;">
            <p>Ce blog est une expérimentation low-tech. Son poids total est de <strong><span id="site-weight">...</span> Ko</strong>. En le fermant de 00h à 8h, on évite le trafic automatisé inutile la nuit tout en valorisant le droit humain à la déconnexion.</p>
        </div>
    </footer>
</body>
</html>
"@
        Write-Utf8File (Join-Path $artDir "$slug.html") $html
        
        $articles.Add([PSCustomObject]@{
            id = $slug
            title = $title
            date = $date
            category = "Environnement" # On met tout en Environnement par défaut, tu changeras à la main
            tags = @()
            image = ""
            content = if ($content.Length -gt 200) { $content.Substring(0, 200) } else { $content }
            views = 0
            draft = $false
        })
        Write-Host "Importé : $title"
    }
}

$json = @{ articles = $articles; categories = @('Environnement','Data','IA','Low Tech','Solarpunk','Dégafamisation'); site_metadata = @{ total_weight_kb = 0; last_updated = "" } }
$jsonStr = $json | ConvertTo-Json -Depth 10
Write-Utf8File $jsonFile $jsonStr
Write-Host "Terminé !"
