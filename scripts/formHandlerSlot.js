document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inschrijfForm');
    const responseMessage = document.getElementById('responseMessage');
    const submitButton = document.getElementById('submitButton');

    let originalButtonText = 'Verstuur inschrijving'; 
    if (submitButton) { 
        originalButtonText = submitButton.textContent;
    }

    if (form) { 
        form.addEventListener('submit', function(event) {
            event.preventDefault(); 

            if (submitButton) { 
                submitButton.disabled = true; 
                submitButton.textContent = 'Verzenden...'; 
                console.log('Button text changed to:', submitButton.textContent);
            } else {
                console.warn('Submit button not found, cannot disable or change text.');
            }
            
            const formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error('Netwerkrespons was niet ok. Status: ' + response.status + ' - ' + response.statusText);
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
                    console.log('Button text restored to:', submitButton.textContent);
                }
            });
        });
    }
});