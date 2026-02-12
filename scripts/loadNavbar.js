document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('nav-placeholder');
    
    fetch('/navbar.html')
        .then(response => {
            if (!response.ok) throw new Error('Navbar niet gevonden');
            return response.text();
        })
        .then(data => {
            placeholder.innerHTML = data;

            // 1. Markeer als geladen voor de CSS animatie
            setTimeout(() => {
                placeholder.classList.add('loaded');
            }, 50);

            // --- DE FIX VOOR DE DROPDOWN/HAMBURGER ---
            // We zoeken alle elementen die Bootstrap moet aansturen en initialiseren ze handmatig
            const toggler = placeholder.querySelector('.navbar-toggler');
            if (toggler && window.bootstrap) {
                new bootstrap.Collapse(document.getElementById('navbarNav'), {
                    toggle: false
                });
            }

            // 2. Active link logica
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                const linkHref = link.getAttribute('href');
                if (currentPath === linkHref || 
                    (currentPath === "/" && linkHref === "/index.html") ||
                    (currentPath.endsWith('/') && linkHref.endsWith('index.html'))) {
                    link.classList.add('active');
                }
            });
        })
        .catch(err => console.error('Fout bij laden navbar:', err));
});
