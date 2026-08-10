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

  // Hier slaan we de goedgekeurde straten van de API in op
  let toegestaneStraten = [];

  const hideDropdown = () => {
    dropdownContainer.style.display = "none";
  };

  // DE HOOFDCONTROLEKAMER: Deze functie runt elke keer als iemand iets typt
  const validateForm = () => {
    let isFormValid = true;

    // Direct eventuele per ongeluk getypte letters strippen uit numerieke velden
    postcodeInput.value = postcodeInput.value.replace(/\D/g, '');
    gsmVisible.value = gsmVisible.value.replace(/\D/g, '');

    // 1. Postcode Controle (Exact 4 cijfers)
    const pc = postcodeInput.value;
    if (pc.length === 0) {
      postcodeInput.classList.remove("is-valid", "is-invalid");
      isFormValid = false;
    } else if (pc.length === 4) {
      postcodeInput.classList.remove("is-invalid");
      postcodeInput.classList.add("is-valid"); // Groen randje
    } else {
      postcodeInput.classList.remove("is-valid");
      postcodeInput.classList.add("is-invalid"); // Rood randje
      isFormValid = false;
    }

    // 2. Straat Controle (Moet exact in de API-lijst staan)
    const straat = straatInput.value.trim().toLowerCase();
    // We maken alle API straten ook kleine letters om veilig te vergelijken
    const geldigeStratenLower = toegestaneStraten.map(s => s.toLowerCase());

    if (straat.length === 0) {
      straatInput.classList.remove("is-valid", "is-invalid");
      isFormValid = false;
    } else if (geldigeStratenLower.includes(straat)) {
      straatInput.classList.remove("is-invalid");
      straatInput.classList.add("is-valid");
    } else {
      straatInput.classList.remove("is-valid");
      straatInput.classList.add("is-invalid");
      isFormValid = false;
    }

    // 3. GSM Controle (Exact 9 cijfers)
    const gsmVal = gsmVisible.value;
    if (gsmVal.length === 0) {
      gsmVisible.classList.remove("is-valid", "is-invalid");
      gsmHidden.value = "";
      isFormValid = false;
    } else if (gsmVal.length === 9) {
      gsmVisible.classList.remove("is-invalid");
      gsmVisible.classList.add("is-valid");
      // Plak hier de +32 en de 9 cijfers samen voor je Python script!
      gsmHidden.value = "+32" + gsmVal; 
    } else {
      gsmVisible.classList.remove("is-valid");
      gsmVisible.classList.add("is-invalid");
      gsmHidden.value = "";
      isFormValid = false;
    }

    // 4. Standaard HTML5 Controles (Zijn naam, email, en radio buttons ingevuld?)
    if (!form.checkValidity()) {
      isFormValid = false;
    }

    // Pas als ELKE check hierboven true is, maken we de knop klikbaar
    if (isFormValid) {
      submitButton.disabled = false;
      submitButton.textContent = "Verstuur inschrijving";
    } else {
      submitButton.disabled = true;
      submitButton.textContent = "Verstuur inschrijving (Vul eerst alles correct in)";
    }
  };

  // Luister naar ELKE aanpassing op het formulier en trigger de validatie
  form.addEventListener("input", validateForm);
  form.addEventListener("change", validateForm);

  // --- API LOGICA ---

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
    validateForm(); // Hertest het formulier
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
          // Haal de straten uit de API, filter de unieke namen eruit
          const gevondenStraten = data.SuggestionResult.map(res => res.split(',')[0].trim());
          toegestaneStraten = [...new Set(gevondenStraten)];

          toegestaneStraten.forEach(straatnaam => {
            if (straatnaam) {
              const li = document.createElement("li");
              const button = document.createElement("button");
              button.type = "button";
              button.className = "dropdown-item text-start w-100";
              button.textContent = straatnaam;
              
              // Als iemand klikt op een dropdown-item:
              button.addEventListener("click", () => {
                straatInput.value = straatnaam;
                toegestaneStraten = [straatnaam]; // Maak deze direct 100% geldig
                validateForm(); // Controleer alles en maak het randje groen
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
    validateForm(); // Hertest het formulier bij elke getypte letter
  });

  document.addEventListener("click", (e) => {
    if (!straatInput.contains(e.target) && !dropdownContainer.contains(e.target)) {
      hideDropdown();
    }
  });
});
