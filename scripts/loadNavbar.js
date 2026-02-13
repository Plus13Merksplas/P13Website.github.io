document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('nav-placeholder');
    
    fetch('/navbar.html')
        .then(response => response.text())
        .then(data => {
            placeholder.innerHTML = data;

            // Laat de content in-faden
            setTimeout(() => {
                document.body.classList.add('page-loaded');
                placeholder.classList.add('loaded');
            }, 50);

            // De manuele klik-fix voor gsm
            const toggler = placeholder.querySelector('.navbar-toggler');
            const menu = placeholder.querySelector('#navbarNav');

            if (toggler && menu) {
                toggler.addEventListener('click', function() {
                    menu.classList.toggle('show');
                });
            }

            // Active link logica
            const currentPath = window.location.pathname;
            const navLinks = placeholder.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                const linkHref = link.getAttribute('href');
                if (currentPath === linkHref || 
                    (currentPath === "/" && linkHref === "/index.html") ||
                    (currentPath.endsWith('/') && linkHref.endsWith('index.html'))) {
                    link.classList.add('active');
                }
            });
        })
        .catch(err => {
            console.error('Navbar kon niet laden:', err);
            document.body.classList.add('page-loaded');
        });
});
