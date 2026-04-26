document.addEventListener('DOMContentLoaded', () => {
    loadPartials();
    checkOpeningHours();
});

async function loadPartials() {
    const headerPlaceholder = document.querySelector('header.site-header');
    const footerPlaceholder = document.querySelector('footer');

    if (headerPlaceholder) {
        try {
            const resp = await fetch('/partials/header.html');
            const html = await resp.text();
            headerPlaceholder.outerHTML = html;
        } catch (e) { console.error("Error loading header:", e); }
    }

    if (footerPlaceholder) {
        try {
            const resp = await fetch('/partials/footer.html');
            const html = await resp.text();
            footerPlaceholder.outerHTML = html;
        } catch (e) { console.error("Error loading footer:", e); }
    }
}

function checkOpeningHours() {
    const now = new Date();
    // UTC+2 logic
    const hour = now.getUTCHours() + 2;
    const currentHour = hour >= 24 ? hour - 24 : hour;
    const isOpen = currentHour >= 8 && currentHour < 24;

    if (!isOpen) {
        // Bloquer l'accès avec un écran complet
        document.body.innerHTML = `
            <div id="closed-screen" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: var(--bg-color, #fdfdfd); color: var(--text-color, #1a1a1a);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                z-index: 9999; text-align: center; font-family: 'Outfit', sans-serif; padding: 2rem;
            ">
                <h1 style="font-size: 3rem;">Le site se repose...</h1>
                <p style="font-size: 1.5rem; max-width: 600px; line-height: 1.6;">
                    Ce blog est <strong>low-tech</strong> : il ferme ses portes la nuit pour économiser l'énergie et encourager la déconnexion.<br><br>
                    Ouverture de <strong>08h00 à 00h00 (UTC+2)</strong>.<br>
                    Revenez nous voir demain !
                </p>
                <div style="margin-top: 2rem; font-family: 'JetBrains Mono', monospace; opacity: 0.7;">
                    Heure actuelle : ${currentHour}h${now.getMinutes().toString().padStart(2, '0')}
                </div>
            </div>
        `;
        // Appliquer le thème même en mode fermé si possible
        const t = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', t);
    }
}
