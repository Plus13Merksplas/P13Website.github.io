document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Elementen selecteren
    const groepSelect = document.getElementById('groep');
    const attestenBlok = document.getElementById('fiscaleGegevensBlok');
    const dateInput = document.getElementById('geboortedatumKind'); 

    // Helper-functie: maakt alle inputs in een blok verplicht of juist niet
    function setRequired(element, isRequired) {
        const inputs = element.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (isRequired) {
                input.setAttribute('required', 'required');
            } else {
                input.removeAttribute('required');
            }
        });
    }

    // Helper-functie: vult tekstvelden in een blok met een waarde (bijv. "NVT")
    function setTextInputValues(element, value) {
        const inputs = element.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.value = value;
        });
    }

    // 2. De logica voor het tonen/verbergen van het fiscale blok
    if (groepSelect) {
        groepSelect.addEventListener('change', function() {
            const geselecteerdeGroep = this.value;

            // Groep 1, 2 en 3 zijn de jongere groepen die attesten nodig hebben
            if (geselecteerdeGroep === 'Groep 1' || geselecteerdeGroep === 'Groep 2' || geselecteerdeGroep === 'Groep 3') {
                attestenBlok.classList.remove('d-none');
                setRequired(attestenBlok, true);
                setTextInputValues(attestenBlok, "");
                
                dateInput.value = ""; 
                dateInput.type = 'date';
            } else {
                // Oudere groepen (4-6) hebben dit niet nodig
                attestenBlok.classList.add('d-none');
                setRequired(attestenBlok, false);
                setTextInputValues(attestenBlok, "NVT");
                
                // Hack: een datumveld accepteert geen tekst, dus we veranderen het type tijdelijk
                dateInput.type = 'text';
                dateInput.value = "NVT";
            }
        });

        // Trigger de check direct bij het laden
        groepSelect.dispatchEvent(new Event('change'));
    }
});
