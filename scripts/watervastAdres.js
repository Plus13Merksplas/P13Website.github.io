document.addEventListener("DOMContentLoaded", () => {
  // Elementen ophalen
  const postcodeInput = document.getElementById("postcode");
  const gemeenteInput = document.getElementById("gemeente");
  const straatInput = document.getElementById("straat");
  const dropdownContainer = document.getElementById("customStreetDropdown");
  const streetList = document.getElementById("customStreetList");

  // DEBUGINFO: Controleren of de elementen gevonden zijn
  console.log("watervastAdres.js geladen. Elementen:", {postcodeInput, gemeenteInput, straatInput, dropdownContainer, streetList});

  // HULPFUNCTIE: Lijst verbergen
  const hideDropdown = () => {
    console.log("Dropdown verbergen.");
    dropdownContainer.style.display = "none";
    streetList.innerHTML = "";
  };

  // 1. Postcode -> Gemeente invullen
  postcodeInput.addEventListener("input", async (e) => {
    const postcode = e.target.value.trim();
    console.log(`Postcode input: '${postcode}'`);
    
    if (postcode.length === 4) {
      console.log("Geldige Vlaamse postcode. Gemeente opzoeken...");
      try {
        const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Location?q=${postcode}&c=1`);
        const data = await response.json();
        console.log("Gemeente API response:", data);
        
        if (data.LocationResult && data.LocationResult.length > 0) {
          const municipality = data.LocationResult[0].Municipality;
          console.log(`Gemeente gevonden: ${municipality}. Veld invullen.`);
          gemeenteInput.value = municipality;
        } else {
          console.log("Geen Vlaamse gemeente gevonden voor deze postcode.");
          gemeenteInput.value = ""; 
        }
      } catch (error) {
        console.error("Fout bij ophalen gemeente via API:", error);
      }
    } else {
      gemeenteInput.value = ""; 
    }
  });

  // 2. Straat -> Live dropdown opbouwen
  straatInput.addEventListener("input", async (e) => {
    const straatQuery = e.target.value.trim();
    const postcode = postcodeInput.value.trim();
    const gemeente = gemeenteInput.value.trim();
    
    console.log(`Straat input: '${straatQuery}'. Postcode: ${postcode}. Gemeente: ${gemeente}`);

    // Voorwaarde: minimaal 2 letters én een geldige postcode en gemeente
    if (postcode.length === 4 && gemeente && straatQuery.length >= 2) {
      console.log("Voorwaarden voldaan. Straten opzoeken via Suggestion API...");
      try {
        // We gebruiken de Suggestion API met postcode en gemeente bias voor Merksplas
        const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Suggestion?q=${straatQuery} ${postcode} ${gemeente}&c=10`);
        const data = await response.json();
        console.log("Straten API response:", data);

        // Oude lijst leegmaken
        streetList.innerHTML = "";

        if (data.SuggestionResult && data.SuggestionResult.length > 0) {
          console.log(`${data.SuggestionResult.length} straten gevonden. Lijst opbouwen.`);
          
          // Resultaat is: "Kerkstraat 2, 2330 Merksplas". We splitsen op de komma en trimmen.
          const gevondenStraten = data.SuggestionResult.map(res => res.split(',')[0].trim());
          const uniekeStraten = [...new Set(gevondenStraten)];

          uniekeStraten.forEach(straatnaam => {
            if (straatnaam) {
              const li = document.createElement("li");
              
              const button = document.createElement("button");
              button.type = "button";
              button.className = "dropdown-item text-start w-100";
              button.textContent = straatnaam;
              
              // Event als iemand op een straat klikt
              button.addEventListener("click", () => {
                console.log(`Straat geselecteerd: ${straatnaam}. Veld invullen en dropdown sluiten.`);
                straatInput.value = straatnaam;
                hideDropdown();
              });

              li.appendChild(button);
              streetList.appendChild(li);
            }
          });
          
          // Dropdown tonen
          dropdownContainer.style.display = "block";
        } else {
          console.log("Geen straten gevonden voor deze zoekopdracht.");
          hideDropdown();
        }
      } catch (error) {
        console.error("Fout bij ophalen straten via API:", error);
        hideDropdown();
      }
    } else {
       // Lijst verbergen als niet aan voorwaarden voldaan is
       hideDropdown();
    }
  });

  // 3. Verberg de lijst als de gebruiker ergens anders op het scherm klikt
  document.addEventListener("click", (e) => {
    if (!straatInput.contains(e.target) && !dropdownContainer.contains(e.target)) {
      console.log("Klik buiten dropdown. Lijst sluiten.");
      hideDropdown();
    }
  });
});
