document.addEventListener("DOMContentLoaded", () => {
  const postcodeInput = document.getElementById("postcode");
  const gemeenteInput = document.getElementById("gemeente");
  const straatInput = document.getElementById("straat");
  const straatnamenLijst = document.getElementById("straatnamenLijst");

  // 1. Postcode -> Automatisch Gemeente invullen (Deze werkte al perfect!)
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
        console.error("Fout bij ophalen gemeente:", error);
      }
    } else {
      gemeenteInput.value = ""; 
    }
  });

  // 2. Straat -> Suggestion API gebruiken voor live autocomplete
  straatInput.addEventListener("input", async (e) => {
    const straat = e.target.value.trim();
    const postcode = postcodeInput.value.trim();

    // Pas zoeken als we een geldige postcode hebben én minstens 2 letters typen
    if (postcode.length === 4 && straat.length >= 2) {
      try {
        // We gebruiken nu de 'Suggestion' API in plaats van 'Location'
        const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Suggestion?q=${straat} ${postcode}&c=10`);
        const data = await response.json();

        // Maak de oude lijst leeg zodat we geen dubbele of oude opties krijgen
        straatnamenLijst.innerHTML = "";

        if (data.SuggestionResult) {
          // De API geeft "Kerkstraat, 2330 Merksplas". 
          // We splitsen op de komma (',') en pakken [0] (het eerste deel, dus de straat)
          const gevondenStraten = data.SuggestionResult.map(resultaat => resultaat.split(',')[0].trim());
          
          // Haal eventuele dubbele resultaten eruit
          const uniekeStraten = [...new Set(gevondenStraten)];

          // Voeg de unieke straten toe aan de datalist
          uniekeStraten.forEach(straatnaam => {
            if (straatnaam) {
              const option = document.createElement("option");
              option.value = straatnaam;
              straatnamenLijst.appendChild(option);
            }
          });
        }
      } catch (error) {
        console.error("Fout bij ophalen straatnamen:", error);
      }
    }
  });
});
