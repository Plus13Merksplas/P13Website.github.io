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
  
  const opmerkingenInput = document.getElementById("opmerkingen"); // Nieuw: opmerkingen ophalen

  // De nieuwe foutmelding-elementen ophalen
  const postcodeError = document.getElementById("postcodeError");
  const straatError = document.getElementById("straatError");
  const gsmError = document.getElementById("gsmError");

  let toegestaneStraten = [];

  const hideDropdown = () => {
    dropdownContainer.style.display = "none";
  };

 const validateForm = () => {
    let isFormValid = true;

    // Postcode blijft gewoon strippen tot enkel cijfers
    postcodeInput.value = postcodeInput.value.replace(/\D/g, '');
    
    // LET OP: gsmVisible strippen we hier NIET meer, want dan verdwijnen de spaties!

    // --- 1. Postcode Controle ---
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

    // --- 2. Straat Controle (Met geheime Override) ---
    const straat = straatInput.value.trim().toLowerCase();
    const geldigeStratenLower = toegestaneStraten.map(s => s.toLowerCase());
    const adminCode = String.fromCharCode(50, 51, 51, 48, 63, 33);
    const isOverrideActief = (document.getElementById("opmerkingen")?.value || "").includes(adminCode);
    
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

    // --- 3. GSM Controle & Slimme Formattering ---
    
    // A. Bewaar waar de cursor nu staat
    let cursor = gsmVisible.selectionStart;
    let stringBeforeCursor = gsmVisible.value.substring(0, cursor);
    // Tel hoeveel échte cijfers er vóór de cursor stonden
    let digitsBeforeCursor = stringBeforeCursor.replace(/\D/g, '').length;
    
    // B. Haal alle niet-cijfers weg, en bewaar max 9 cijfers
    let rawGsm = gsmVisible.value.replace(/\D/g, '').substring(0, 9);
    
    // C. Bouw de string opnieuw op mét spaties (XXX XX XX XX)
    let formattedGsm = '';
    let newCursor = 0;
    let digitCount = 0;
    
    for (let i = 0; i < rawGsm.length; i++) {
      // Voeg een spatie toe na 3, 5 en 7 cijfers
      if (i === 3 || i === 5 || i === 7) {
        formattedGsm += ' ';
        // Als we een spatie toevoegen vóór ons doel-cijfer, schuift de cursor mee
        if (digitCount < digitsBeforeCursor) newCursor++;
      }
      formattedGsm += rawGsm[i];
      digitCount++;
      if (digitCount <= digitsBeforeCursor) newCursor++;
    }
    
    // D. Check of het veld geselecteerd is (zodat we focus niet stelen van andere velden)
    let isGsmFocused = (document.activeElement === gsmVisible);
    
    // Zet de mooi geformatteerde waarde terug
    gsmVisible.value = formattedGsm;
    
    // Zet de cursor exact terug waar hij hoort
    if (isGsmFocused) {
      gsmVisible.setSelectionRange(newCursor, newCursor);
    }

    // E. Nu de Validatie voor de kleuren (we testen de rawGsm van 9 cijfers!)
    if (rawGsm.length === 0) {
      gsmVisible.classList.remove("is-valid", "is-invalid");
      gsmError.classList.add("d-none");
      gsmHidden.value = "";
      isFormValid = false;
    } else if (rawGsm.length === 9) {
      gsmVisible.classList.remove("is-invalid");
      gsmVisible.classList.add("is-valid");
      gsmError.classList.add("d-none");
      gsmHidden.value = "+32" + rawGsm; // Het verborgen veld krijgt de zuivere cijfers mét +32
    } else {
      gsmVisible.classList.remove("is-valid");
      gsmVisible.classList.add("is-invalid");
      gsmError.classList.remove("d-none"); 
      gsmHidden.value = "";
      isFormValid = false;
    }

    // --- 4. Standaard HTML5 Controles ---
    if (!form.checkValidity()) {
      isFormValid = false;
    }

    if (isFormValid) {
      submitButton.disabled = false;
      submitButton.textContent = "Verstuur inschrijving";
    } else {
      submitButton.disabled = true;
      submitButton.textContent = "Verstuur inschrijving (Vul eerst alles correct in)";
    }
  };

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
  
  // Zorg dat het formulier ook her-evalueert als er in de opmerkingen wordt getypt
  opmerkingenInput.addEventListener("input", validateForm);

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
