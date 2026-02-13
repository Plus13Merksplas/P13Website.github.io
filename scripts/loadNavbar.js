document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('nav-placeholder');
    
    fetch('/navbar.html')
        .then(response => response.text())
        .then(data => {
            placeholder.innerHTML = data;

            // 1. Navbar fade-in effect
            setTimeout(() => {
                placeholder.classList.add('loaded');
            }, 50);

            // 2. DE NIEUWE REGEL: Laat de hele pagina nu zachtjes verschijnen
            document.body.classList.add('page-loaded');

            // --- DE MANUELE KLIK-FIX (Die al werkte) ---
            const toggler = placeholder.querySelector('.navbar-toggler');
            const menu = placeholder.querySelector('#navbarNav');
            if (toggler && menu) {
                toggler.addEventListener('click', function() {
                    const isOpen = menu.classList.contains('show');
                    if (isOpen) {
                        menu.classList.remove('show');
                        this.classList.add('collapsed');
                    } else {
                        menu.classList.add('show');
                        this.classList.remove('collapsed');
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
        .catch(err => {
            console.error('Navbar kon niet laden:', err);
            // Zorg dat de pagina ALTIJD verschijnt, ook bij een fout
            document.body.classList.add('page-loaded');
        });
});
