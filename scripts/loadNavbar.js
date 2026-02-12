document.addEventListener("DOMContentLoaded", function() {
    // 1. Haal de navbar op uit de root
    fetch('/navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('nav-placeholder').innerHTML = data;

            // 2. Highlight de actieve pagina
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-link');

            navLinks.forEach(link => {
                // We checken of de href van de link overeenkomt met het huidige pad
                if (link.getAttribute('href') === currentPath || 
                   (currentPath === "/" && link.getAttribute('href') === "/index.html")) {
                    link.classList.add('active');
                }
            });
        })
        .catch(err => console.error('Fout bij laden navbar:', err));
});
