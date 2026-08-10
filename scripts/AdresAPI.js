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
    if (dropdownContainer) dropdownContainer.style.display = "none";
  };

  // --- De Dwangarbeider voor het GSM Veld ---
  if (gsmVisible) {
    gsmVisible.addEventListener("input", function(e) {
      let cursorPosition = this.selectionStart;
      let unformattedBeforeCursor = this.value.substring(0, cursorPosition).replace(/\D/g, '');
      let rawDigits = this.value.replace(/\D/g, '').substring(0, 9);
      
      let formatted = '';
      let newCursorPosition = 0;
      let unformattedCount = 0;

      for (let i = 0; i < rawDigits.length; i++) {
        if (i === 3 || i === 5 || i === 7) {
          formatted += ' ';
          if (unformattedCount < unformattedBeforeCursor.length) newCursorPosition++;
        }
        formatted += rawDigits[i];
        unformattedCount++;
        if (unformattedCount <= unformattedBeforeCursor.length) newCursorPosition++;
      }

      this.value = formatted;
      this.setSelectionRange(newCursorPosition, newCursorPosition);
    });
  }

  // --- Formulier Validatie ---
  const validateForm = () => {
    let isFormValid = true;

    if (postcodeInput) postcodeInput.value = postcodeInput.value.replace(/\D/g, '');

    // Geheime Override (code "2330?!")
    const adminCode = String.fromCharCode(50, 51, 51, 48, 63, 33);
    const isOverrideActief = opmerkingenInput ? opmerkingenInput.value.includes(adminCode) : false;

    // 1. Postcode
    if (postcodeInput) {
      const pc = postcodeInput.value;
      if (pc.length === 0) {
        postcodeInput.classList.remove("is-valid", "is-invalid");
        if(postcodeError) postcodeError.classList.add("d-none"); 
        isFormValid = false;
      } else if (pc.length === 4) {
        postcodeInput.classList.remove("is-invalid");
        postcodeInput.classList.add("is-valid");
        if(postcodeError) postcodeError.classList.add("d-none"); 
      } else {
        postcodeInput.classList.remove("is-valid");
        postcodeInput.classList.add("is-invalid");
        if(postcodeError) postcodeError.classList.remove("d-none"); 
        isFormValid = false;
      }
    }

    // 2. Straat
    if (straatInput) {
      const straat = straatInput.value.trim().toLowerCase();
      const geldigeStratenLower = toegestaneStraten.map(s => s.toLowerCase());
      
      if (straat.length === 0) {
        straatInput.classList.remove("is-valid", "is-invalid");
        if (straatError) straatError.classList.add("d-none");
        isFormValid = false;
      } else if (geldigeStratenLower.includes(straat) || isOverrideActief) {
        straatInput.classList.remove("is-invalid");
        straatInput.classList.add("is-valid");
        if (straatError) straatError.classList.add("d-none");
      } else {
        const huidigeGemeente = gemeenteInput && gemeenteInput.value.trim() !== "" ? gemeenteInput.value.trim() : "deze gemeente";
        straatInput.classList.remove("is-valid");
        straatInput.classList.add("is-invalid");
        if (straatError) {
            straatError.textContent = `Deze straat bestaat niet in ${huidigeGemeente}.`;
            straatError.classList.remove("d-none"); 
        }
        isFormValid = false;
      }
    }

    // 3. GSM
    if (gsmVisible && gsmHidden) {
      const rawGsm = gsmVisible.value.replace(/\D/g, '');
      if (rawGsm.length === 0) {
        gsmVisible.classList.remove("is-valid", "is-invalid");
        if (gsmError) gsmError.classList.add("d-none");
        gsmHidden.value = "";
        isFormValid = false;
      } else if (rawGsm.length === 9) {
        gsmVisible.classList.remove("is-invalid");
        gsmVisible.classList.add("is-valid");
        if (gsmError) gsmError.classList.add("d-none");
        gsmHidden.value = "+32" + rawGsm; 
      } else {
        gsmVisible.classList.remove("is-valid");
        gsmVisible.classList.add("is-invalid");
        if (gsmError) gsmError.classList.remove("d-none"); 
        gsmHidden.value = "";
        isFormValid = false;
      }
    }

    // 4. Form validiteit
    if (form && !form.checkValidity()) {
      isFormValid = false;
    }

    if (submitButton) {
      if (isFormValid) {
        submitButton.disabled = false;
        submitButton.textContent = "Verstuur inschrijving";
      } else {
        submitButton.disabled = true;
        submitButton.textContent = "Verstuur inschrijving (Vul eerst alles correct in)";
      }
    }
  };

  // Event listeners voor validatie
  if (form) {
    form.addEventListener("input", validateForm);
    form.addEventListener("change", validateForm);
  }
  if (opmerkingenInput) opmerkingenInput.addEventListener("input", validateForm);

  // API voor Locaties
  if (postcodeInput) {
    postcodeInput.addEventListener("input", async (e) => {
      const postcode = e.target.value.trim();
      if (postcode.length === 4) {
        try {
          const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Location?q=${postcode}&c=1`);
          const data = await response.json();
          if (data.LocationResult && data.LocationResult.length > 0 && gemeenteInput) {
            gemeenteInput.value = data.LocationResult[0].Municipality;
          } else if (gemeenteInput) {
            gemeenteInput.value = ""; 
          }
        } catch (error) {
          console.error(error);
        }
      } else if (gemeenteInput) {
        gemeenteInput.value = ""; 
      }
      validateForm(); 
    });
  }

  if (straatInput) {
    straatInput.addEventListener("input", async (e) => {
      const straatQuery = e.target.value.trim();
      const postcode = postcodeInput ? postcodeInput.value.trim() : "";
      const gemeente = gemeenteInput ? gemeenteInput.value.trim() : "";
      
      if (postcode.length === 4 && gemeente && straatQuery.length >= 2) {
        try {
          const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Suggestion?q=${straatQuery} ${postcode} ${gemeente}&c=10`);
          const data = await response.json();
          
          if (streetList) streetList.innerHTML = "";

          if (data.SuggestionResult && data.SuggestionResult.length > 0) {
            const gevondenStraten = data.SuggestionResult.map(res => res.split(',')[0].trim());
            toegestaneStraten = [...new Set(gevondenStraten)];

            toegestaneStraten.forEach(straatnaam => {
              if (straatnaam && streetList) {
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
            if (dropdownContainer) dropdownContainer.style.display = "block";
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
  }

  // Klik ergens anders = verberg dropdown
  document.addEventListener("click", (e) => {
    if (straatInput && dropdownContainer && !straatInput.contains(e.target) && !dropdownContainer.contains(e.target)) {
      hideDropdown();
    }
  });

  // Beveiliging tegen handmatig submitten
  if (form) {
    form.addEventListener("submit", (e) => {
      validateForm();
      if (submitButton && submitButton.disabled) {
        e.preventDefault(); 
        e.stopImmediatePropagation(); 
        alert("Leuke poging, maar je moet het formulier wel correct invullen! 😉");
      }
    });
  }

  // --- DE GOOGLE RECAPTCHA TROLL ---
  const fotosSelect = document.getElementById("fotosOK");
  const captchaModalEl = document.getElementById("captchaModal");
  let isCaptchaPassed = false;

  // Maak de callback bereikbaar voor Google
  window.reCaptchaGelukt = function() {
    isCaptchaPassed = true;
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined' && captchaModalEl) {
        bootstrap.Modal.getOrCreateInstance(captchaModalEl).hide();
      }
    }, 800);
  };

  // Luister naar de Keuzelijst (Dropdown)
  if (fotosSelect) {
    fotosSelect.addEventListener("change", function() {
      if (this.value === "Nee") {
        isCaptchaPassed = false;
        
        // Reset Google Captcha indien aanwezig
        if (typeof grecaptcha !== 'undefined') {
          grecaptcha.reset();
        }
        
        // Open de Modal via Bootstrap
        if (typeof bootstrap !== 'undefined' && captchaModalEl) {
          bootstrap.Modal.getOrCreateInstance(captchaModalEl).show();
        } else {
          console.error("Bootstrap is niet geladen, modal kan niet openen.");
        }
      }
    });
  }

  // Straf indien pop-up gesloten wordt zonder succes
  if (captchaModalEl) {
    captchaModalEl.addEventListener("hide.bs.modal", function() {
      if (!isCaptchaPassed && fotosSelect) {
        fotosSelect.value = "Ja"; // BOEM, weer terug naar Ja!
      }
    });
  }
});
