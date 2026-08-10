document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inschrijfForm");
  const submitButton = document.getElementById("submitButton");

  const postcodeInput = document.getElementById("postcode");
  const gemeenteInput = document.getElementById("gemeente");
  const straatInput = document.getElementById("straat");
  const dropdownContainer = document.getElementById("customStreetDropdown");
  const streetList = document.getElementById("customStreetList");

  const gsmVisible = document.getElementById("gsm_visible");
  const gsmHidden = document.getElementById("gsm");
  const opmerkingenInput = document.getElementById("opmerkingen"); 

  const postcodeError = document.getElementById("postcodeError");
  const straatError = document.getElementById("straatError");
  const gsmError = document.getElementById("gsmError");

  let toegestaneStraten = [];

  const hideDropdown = () => {
    dropdownContainer.style.display = "none";
  };

  // --- NIEUW: De Dwangarbeider voor het GSM Veld ---
  gsmVisible.addEventListener("input", function(e) {
    // 1. Bewaar de huidige cursor positie
    let cursorPosition = this.selectionStart;
    
    // 2. Bereken hoeveel échte cijfers er vóór de cursor stonden
    let unformattedBeforeCursor = this.value.substring(0, cursorPosition).replace(/\D/g, '');
    
    // 3. Haal de pure cijfers uit het veld (gooit elke getypte spatie of letter in de prullenbak)
    let rawDigits = this.value.replace(/\D/g, '').substring(0, 9);
    
    // 4. Bouw de string opnieuw op met ónze spaties (XXX XX XX XX)
    let formatted = '';
    let newCursorPosition = 0;
    let unformattedCount = 0;

    for (let i = 0; i < rawDigits.length; i++) {
      // Voeg spaties toe op index 3, 5 en 7
      if (i === 3 || i === 5 || i === 7) {
        formatted += ' ';
        // Als we een spatie toevoegen vóór de cursor, schuift de cursor één plekje op
        if (unformattedCount < unformattedBeforeCursor.length) {
          newCursorPosition++;
        }
      }
      
      formatted += rawDigits[i];
      unformattedCount++;
      
      if (unformattedCount <= unformattedBeforeCursor.length) {
        newCursorPosition++;
      }
    }

    // 5. Zet de perfect geformatteerde tekst in het input veld
    this.value = formatted;
    
    // 6. Zet de cursor exact terug waar de gebruiker gebleven was
    this.setSelectionRange(newCursorPosition, newCursorPosition);
  });
  // ----------------------------------------------------

  const validateForm = () => {
    let isFormValid = true;

    postcodeInput.value = postcodeInput.value.replace(/\D/g, '');

    // Geheime Override (code "2330?!")
    const adminCode = String.fromCharCode(50, 51, 51, 48, 63, 33);
    const isOverrideActief = (opmerkingenInput?.value || "").includes(adminCode);

    // 1. Postcode Controle
    const pc = postcodeInput.value;
    if (pc.length === 0) {
      postcodeInput.classList.remove("is-valid", "is-invalid");
      postcodeError.classList.add("d-none"); 
      isFormValid = false;
    } else if (pc.length === 4) {
      postcodeInput.classList.remove("is-invalid");
      postcodeInput.classList.add("is-valid");
      postcodeError.classList.add("d-none"); 
    } else {
      postcodeInput.classList.remove("is-valid");
      postcodeInput.classList.add("is-invalid");
      postcodeError.classList.remove("d-none"); 
      isFormValid = false;
    }

    // 2. Straat Controle
    const straat = straatInput.value.trim().toLowerCase();
    const geldigeStratenLower = toegestaneStraten.map(s => s.toLowerCase());
    
    if (straat.length === 0) {
      straatInput.classList.remove("is-valid", "is-invalid");
      straatError.classList.add("d-none");
      isFormValid = false;
    } else if (geldigeStratenLower.includes(straat) || isOverrideActief) {
      straatInput.classList.remove("is-invalid");
      straatInput.classList.add("is-valid");
      straatError.classList.add("d-none");
    } else {
      const huidigeGemeente = gemeenteInput.value.trim() || "deze gemeente";
      straatInput.classList.remove("is-valid");
      straatInput.classList.add("is-invalid");
      straatError.textContent = `Deze straat bestaat niet in ${huidigeGemeente}.`;
      straatError.classList.remove("d-none"); 
      isFormValid = false;
    }

    // 3. GSM Controle
    // We checken de lengte op basis van de pure cijfers, zonder de spaties
    const rawGsm = gsmVisible.value.replace(/\D/g, '');
    if (rawGsm.length === 0) {
      gsmVisible.classList.remove("is-valid", "is-invalid");
      gsmError.classList.add("d-none");
      gsmHidden.value = "";
      isFormValid = false;
    } else if (rawGsm.length === 9) {
      gsmVisible.classList.remove("is-invalid");
      gsmVisible.classList.add("is-valid");
      gsmError.classList.add("d-none");
      // Verborgen veld krijgt de zuivere reeks: +32412345678
      gsmHidden.value = "+32" + rawGsm; 
    } else {
      gsmVisible.classList.remove("is-valid");
      gsmVisible.classList.add("is-invalid");
      gsmError.classList.remove("d-none"); 
      gsmHidden.value = "";
      isFormValid = false;
    }

    // 4. Standaard HTML5 Controles
    if (!form.checkValidity()) {
      isFormValid = false;
    }

    // Knop ontgrendelen of blokkeren
    if (isFormValid) {
      submitButton.disabled = false;
      submitButton.textContent = "Verstuur inschrijving";
    } else {
      submitButton.disabled = true;
      submitButton.textContent = "Verstuur inschrijving (Vul eerst alles correct in)";
    }
  };

  form.addEventListener("input", validateForm);
  form.addEventListener("change", validateForm);
  if(opmerkingenInput) opmerkingenInput.addEventListener("input", validateForm);

  // Postcode API
  postcodeInput.addEventListener("input", async (e) => {
    const postcode = e.target.value.trim();
    if (postcode.length === 4) {
      try {
        const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Location?q=${postcode}&c=1`);
        const data = await response.json();
        if (data.LocationResult && data.LocationResult.length > 0) {
          gemeenteInput.value = data.LocationResult[0].Municipality;
        } else {
          gemeenteInput.value = ""; 
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      gemeenteInput.value = ""; 
    }
    validateForm(); 
  });

  // Straat API
  straatInput.addEventListener("input", async (e) => {
    const straatQuery = e.target.value.trim();
    const postcode = postcodeInput.value.trim();
    const gemeente = gemeenteInput.value.trim();
    
    if (postcode.length === 4 && gemeente && straatQuery.length >= 2) {
      try {
        const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Suggestion?q=${straatQuery} ${postcode} ${gemeente}&c=10`);
        const data = await response.json();
        
        streetList.innerHTML = "";

        if (data.SuggestionResult && data.SuggestionResult.length > 0) {
          const gevondenStraten = data.SuggestionResult.map(res => res.split(',')[0].trim());
          toegestaneStraten = [...new Set(gevondenStraten)];

          toegestaneStraten.forEach(straatnaam => {
            if (straatnaam) {
              const li = document.createElement("li");
              const button = document.createElement("button");
              button.type = "button";
              button.className = "dropdown-item text-start w-100";
              button.textContent = straatnaam;
              
              button.addEventListener("click", () => {
                straatInput.value = straatnaam;
                toegestaneStraten = [straatnaam]; 
                validateForm(); 
                hideDropdown();
              });

              li.appendChild(button);
              streetList.appendChild(li);
            }
          });
          dropdownContainer.style.display = "block";
        } else {
          hideDropdown();
        }
      } catch (error) {
        console.error(error);
        hideDropdown();
      }
    } else {
       hideDropdown();
    }
    validateForm(); 
  });

  document.addEventListener("click", (e) => {
    if (!straatInput.contains(e.target) && !dropdownContainer.contains(e.target)) {
      hideDropdown();
    }
  });

  // --- EXTRA BEVEILIGING Tegen handmatige submit hacks ---
  form.addEventListener("submit", (e) => {
    validateForm();
    if (submitButton.disabled) {
      e.preventDefault(); 
      e.stopImmediatePropagation(); 
      alert("Leuke poging, maar je moet het formulier wel correct invullen! 😉");
    }
  });
});
