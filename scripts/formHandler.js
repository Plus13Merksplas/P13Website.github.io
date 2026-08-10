document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inschrijfForm');
    const responseMessage = document.getElementById('responseMessage');
    const submitButton = document.getElementById('submitButton');
    const originalButtonText = submitButton ? submitButton.textContent : 'Verstuur inschrijving (Vul eerst alles correct in)';

    if (form) {
        form.addEventListener('submit', function(event) {
            // DIT IS CRUCIAAL: Dit voorkomt dat je naar die lelijke zwarte Google pagina gaat
            event.preventDefault();

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Gegevens veilig verwerken...;
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
                    submitButton.textContent = 'Verstuur inschrijving';
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
                // HIER ZIT DE ANTI-HACK TRUC:
                // We kijken of de server validatie (Google Script) een fout heeft gevonden
                if (data.startsWith("Fout bij validatie")) {
                    responseMessage.style.display = 'block';
                    responseMessage.classList.remove('alert-success');
                    responseMessage.classList.add('alert-danger');
                    responseMessage.textContent = data; // Toont "Ongeldige postcode" etc.
                    responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return; // Stop met uitvoeren (dus ga NIET naar de bedankt pagina)
                }

                // GEEN FOUTEN? Kijk of we moeten doorsturen!
                const redirectUrl = form.getAttribute('data-redirect');

                if (redirectUrl) {
                    // JA: Stuur door naar bedankt.html
                    window.location.href = redirectUrl;
                } else {
                    // NEE: Blijf hier en toon bericht (als fallback)
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
                // Dit zorgt dat de knop weer werkt als er toch iets fout ging
                if (submitButton && !data?.startsWith("Fout bij validatie")) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Verstuur inschrijving';
                }
            });
        });
    }
});
