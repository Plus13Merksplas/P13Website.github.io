document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('nav-placeholder');
    
    // 1. Haal de navbar op vanaf de root
    fetch('/navbar.html')
        .then(response => {
            if (!response.ok) throw new Error('Navbar niet gevonden');
            return response.text();
        })
        .then(data => {
            // 2. Stop de HTML in de zwarte balk
            placeholder.innerHTML = data;

            // 3. Activeer de fade-in van de links na een korte delay
            setTimeout(() => {
                placeholder.classList.add('loaded');
            }, 50);

            // 4. Zoek welke link 'active' moet zijn
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-link');

            navLinks.forEach(link => {
                const linkHref = link.getAttribute('href');
                // Check of de URL overeenkomt (ook voor de homepagina)
                if (currentPath === linkHref || 
                    (currentPath === "/" && linkHref === "/index.html") ||
                    (currentPath.endsWith('/') && linkHref.endsWith('index.html'))) {
                    link.classList.add('active');
                }
            });
        })
        .catch(err => console.error('Fout:', err));
});
