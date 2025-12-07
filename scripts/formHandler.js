document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inschrijfForm');
    const responseMessage = document.getElementById('responseMessage');
    const submitButton = document.getElementById('submitButton');
    const originalButtonText = submitButton ? submitButton.textContent : 'Verstuur inschrijving';

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Verzenden...';
            }

            const formData = new FormData(form);

            // Validatie geboortedatum (indien het veld bestaat en ingevuld is)
            const geboortedatum = formData.get('geboortedatum');
            const datumRegex = /^\d{2}\/\d{2}\/\d{4}$/;

            if (geboortedatum && !datumRegex.test(geboortedatum)) {
                // Als het veld 'geboortedatum' bestaat en fout is:
                responseMessage.style.display = 'block';
                responseMessage.classList.remove('alert-success');
                responseMessage.classList.add('alert-danger');
                responseMessage.textContent = 'Voer je geboortedatum in als dd/mm/jjjj.';
                
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
                responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) return response.text();
                throw new Error('Netwerkfout');
            })
            .then(data => {
                // HIER ZIT DE TRUC:
                // We kijken of de HTML pagina een specifieke redirect vraagt
                const redirectUrl = form.getAttribute('data-redirect');

                if (redirectUrl) {
                    // JA (Weekend pagina): Stuur door naar de PDF pagina
                    window.location.href = redirectUrl;
                } else {
                    // NEE (Gewone inschrijving): Blijf hier en toon bericht
                    responseMessage.style.display = 'block';
                    responseMessage.classList.remove('alert-danger');
                    responseMessage.classList.add('alert-success');
                    responseMessage.textContent = "Bedankt! Je inschrijving is goed ontvangen."; 
                    form.reset();
                    responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                responseMessage.style.display = 'block';
                responseMessage.classList.remove('alert-success');
                responseMessage.classList.add('alert-danger');
                responseMessage.textContent = 'Er ging iets mis. Probeer het later opnieuw.';
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            });
        });
    }
});
