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

            // ✅ Validatie geboortedatum: dd/mm/jjjj
            const geboortedatum = formData.get('geboortedatum');
            const datumRegex = /^\d{2}\/\d{2}\/\d{4}$/;

            if (!datumRegex.test(geboortedatum)) {
                responseMessage.style.display = 'block';
                responseMessage.classList.remove('alert-success');
                responseMessage.classList.add('alert-danger');
                responseMessage.textContent = 'Voer je geboortedatum in als dd/mm/jjjj (bijv. 27/05/2025).';

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
                if (response.ok) {
                    return response.text();
                }
                throw new Error('Netwerkrespons was niet ok. Status: ' + response.status);
            })
            .then(data => {
                responseMessage.style.display = 'block';
                responseMessage.classList.remove('alert-danger');
                responseMessage.classList.add('alert-success');
                responseMessage.textContent = data;
                form.reset();

                responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .catch(error => {
                console.error('Fout bij verzenden formulier:', error);
                responseMessage.style.display = 'block';
                responseMessage.classList.remove('alert-success');
                responseMessage.classList.add('alert-danger');
                responseMessage.textContent = 'Er is een fout opgetreden bij het versturen van je inschrijving. Probeer het later opnieuw. Details: ' + error.message;

                responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
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