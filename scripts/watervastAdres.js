document.addEventListener("DOMContentLoaded", () => {
  form.addEventListener("submit", (e) => {
  // Controleer de velden nog één keer vlak voor verzenden
  validateForm();
  
  // Als de submit knop nog steeds disabled is (formulier is niet geldig), stop de verzending!
  if (submitButton.disabled) {
    e.preventDefault(); // Dit blokkeert de verzending
    alert("Leuke poging, maar je moet het formulier wel correct invullen! 😉");
  }
});
  const form = document.getElementById("inschrijfForm");
  const submitButton = document.getElementById("submitButton");

  const postcodeInput = document.getElementById("postcode");
  const gemeenteInput = document.getElementById("gemeente");
  const straatInput = document.getElementById("straat");
  const dropdownContainer = document.getElementById("customStreetDropdown");
  const streetList = document.getElementById("customStreetList");

  const gsmVisible = document.getElementById("gsm_visible");
  const gsmHidden = document.getElementById("gsm");

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

    postcodeInput.value = postcodeInput.value.replace(/\D/g, '');
    gsmVisible.value = gsmVisible.value.replace(/\D/g, '');

    // 1. Postcode Controle
    const pc = postcodeInput.value;
    if (pc.length === 0) {
      postcodeInput.classList.remove("is-valid", "is-invalid");
      postcodeError.classList.add("d-none"); // Verberg fout als veld nog leeg is
      isFormValid = false;
    } else if (pc.length === 4) {
      postcodeInput.classList.remove("is-invalid");
      postcodeInput.classList.add("is-valid");
      postcodeError.classList.add("d-none"); // Alles klopt, verberg fout
    } else {
      postcodeInput.classList.remove("is-valid");
      postcodeInput.classList.add("is-invalid");
      postcodeError.classList.remove("d-none"); // Toon fout: "Een postcode bevat 4 cijfers."
      isFormValid = false;
    }

    // 2. Straat Controle
    const straat = straatInput.value.trim().toLowerCase();
    const geldigeStratenLower = toegestaneStraten.map(s => s.toLowerCase());
    
    if (straat.length === 0) {
      straatInput.classList.remove("is-valid", "is-invalid");
      straatError.classList.add("d-none");
      isFormValid = false;
    } else if (geldigeStratenLower.includes(straat)) {
      straatInput.classList.remove("is-invalid");
      straatInput.classList.add("is-valid");
      straatError.classList.add("d-none");
    } else {
      // Straat klopt niet! Pak de naam van de gemeente (of val terug op 'deze gemeente')
      const huidigeGemeente = gemeenteInput.value.trim() || "deze gemeente";
      
      straatInput.classList.remove("is-valid");
      straatInput.classList.add("is-invalid");
      
      // Update de tekst in de foutmelding
      straatError.textContent = `Deze straat bestaat niet in ${huidigeGemeente}.`;
      straatError.classList.remove("d-none"); // Toon de fout
      
      isFormValid = false;
    }

    // 3. GSM Controle
    const gsmVal = gsmVisible.value;
    if (gsmVal.length === 0) {
      gsmVisible.classList.remove("is-valid", "is-invalid");
      gsmError.classList.add("d-none");
      gsmHidden.value = "";
      isFormValid = false;
    } else if (gsmVal.length === 9) {
      gsmVisible.classList.remove("is-invalid");
      gsmVisible.classList.add("is-valid");
      gsmError.classList.add("d-none");
      gsmHidden.value = "+32" + gsmVal; 
    } else {
      gsmVisible.classList.remove("is-valid");
      gsmVisible.classList.add("is-invalid");
      gsmError.classList.remove("d-none"); // Toon fout: "Dit nummer is te kort."
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
});
