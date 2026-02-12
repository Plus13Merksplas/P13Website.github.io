document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('nav-placeholder');
    
    // Gebruik ALTIJD de slash vooraan voor root-relative paden
    fetch('/navbar.html')
        .then(response => response.text())
        .then(data => {
            placeholder.innerHTML = data;

            // Fade-in effect voor de looks
            setTimeout(() => {
                placeholder.classList.add('loaded');
            }, 50);

            // --- DE MANUELE KLIK-FIX ---
            // We zoeken de knop en het menu IN de placeholder
            const toggler = placeholder.querySelector('.navbar-toggler');
            const menu = placeholder.querySelector('#navbarNav');

            if (toggler && menu) {
                toggler.addEventListener('click', function() {
                    // We checken of het menu al open is
                    const isOpen = menu.classList.contains('show');
                    
                    if (isOpen) {
                        menu.classList.remove('show');
                        this.classList.add('collapsed');
                        this.setAttribute('aria-expanded', 'false');
                    } else {
                        menu.classList.add('show');
                        this.classList.remove('collapsed');
                        this.setAttribute('aria-expanded', 'true');
                    }
                });
            }

            // Active link logica
            const currentPath = window.location.pathname;
            const navLinks = placeholder.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                const linkHref = link.getAttribute('href');
                if (currentPath === linkHref || (currentPath === "/" && linkHref === "/index.html")) {
                    link.classList.add('active');
                }
            });
        })
        .catch(err => console.error('Navbar kon niet laden:', err));
});
