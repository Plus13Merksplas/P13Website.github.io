document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('nav-placeholder');
    
    fetch('/navbar.html')
        .then(response => response.text())
        .then(data => {
            placeholder.innerHTML = data;

            // We wachten een fractie zodat de browser de nieuwe HTML ziet
            setTimeout(() => {
                placeholder.classList.add('loaded');
            }, 50);

            // Active link logica
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link.getAttribute('href') === currentPath || 
                   (currentPath === "/" && link.getAttribute('href') === "/index.html")) {
                    link.classList.add('active');
                }
            });
        });
});
