document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('nav-placeholder');
    
    // 1. Haal de navbar op vanaf de root van de site
    fetch('/navbar.html')
        .then(response => {
            if (!response.ok) throw new Error('Navbar niet gevonden');
            return response.text();
        })
        .then(data => {
            // 2. Injecteer de HTML in de placeholder
            placeholder.innerHTML = data;

            // 3. Voeg de 'loaded' class toe voor de vloeiende fade-in (tegen het flitsen)
            // Dit werkt samen met de 'opacity: 0' in je CSS
            setTimeout(() => {
                placeholder.classList.add('loaded');
            }, 10); 

            // 4. Markeer de huidige pagina als 'active'
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-link');

            navLinks.forEach(link => {
                const linkHref = link.getAttribute('href');
                
                // Controleer of de link matcht met de huidige URL
                // We checken zowel de volledige match als de index.html/root situatie
                if (currentPath === linkHref || 
                    (currentPath === "/" && linkHref === "/index.html") ||
                    (currentPath.endsWith('/') && linkHref.endsWith('index.html'))) {
                    link.classList.add('active');
                }
            });
        })
        .catch(err => {
            console.error('Fout bij het laden van de navbar:', err);
            // Optioneel: toon een foutmelding of laat de balk leeg
        });
});
