fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) return response.text();
                throw new Error('Netwerkfout');
            })
            .then(data => {
                // HIER ZIT DE AANPASSING VOOR BACKEND VALIDATIE
                if (data.startsWith("Fout bij validatie")) {
                    // De backend heeft het geweigerd (sabotage poging)
                    responseMessage.style.display = 'block';
                    responseMessage.classList.remove('alert-success');
                    responseMessage.classList.add('alert-danger');
                    responseMessage.textContent = data; // Toon de foutmelding van de server
                    responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return; // Stop verdere uitvoering (geen redirect, formulier niet legen)
                }

                // De rest blijft hetzelfde (succes!)
                const redirectUrl = form.getAttribute('data-redirect');

                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
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
