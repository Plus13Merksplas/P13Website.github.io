document.addEventListener("DOMContentLoaded", () => {
  const postcodeInput = document.getElementById("postcode");
  const gemeenteInput = document.getElementById("gemeente");
  const straatInput = document.getElementById("straat");
  const straatnamenLijst = document.getElementById("straatnamenLijst");

  // 1. Postcode -> Automatisch Gemeente invullen
  postcodeInput.addEventListener("input", async (e) => {
    const postcode = e.target.value.trim();
    
    // Check of er 4 cijfers zijn ingevuld (Belgische postcodes)
    if (postcode.length === 4) {
      try {
        // Haal locatiegegevens op via de Vlaamse overheid API
        const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Location?q=${postcode}&c=1`);
        const data = await response.json();
        
        if (data.LocationResult && data.LocationResult.length > 0) {
          gemeenteInput.value = data.LocationResult[0].Municipality;
        } else {
          gemeenteInput.value = ""; // Geen geldige Vlaamse postcode gevonden
        }
      } catch (error) {
        console.error("Fout bij ophalen gemeente:", error);
      }
    } else {
      gemeenteInput.value = ""; // Maak leeg als postcode geen 4 cijfers is
    }
  });

  // 2. Straat -> Automatisch suggesties geven op basis van de gemeente
  straatInput.addEventListener("input", async (e) => {
    const straat = e.target.value.trim();
    const postcode = postcodeInput.value.trim();
    const gemeente = gemeenteInput.value.trim();

    // Pas zoeken als we een geldige postcode hebben én minstens 2 letters van de straat
    if (postcode.length === 4 && gemeente && straat.length >= 2) {
      try {
        // Zoek specifiek naar straatnamen ('Thoroughfarename') in de ingevulde postcode
        const response = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Location?q=${straat} ${postcode}&c=10&type=Thoroughfarename`);
        const data = await response.json();

        // Maak de oude lijst leeg
        straatnamenLijst.innerHTML = "";

        if (data.LocationResult) {
          // De API geeft soms dubbele resultaten, deze code filtert de unieke straten eruit
          const uniekeStraten = [...new Set(data.LocationResult.map(loc => loc.Thoroughfarename))];

          // Voeg de gevonden straten toe aan de dropdown lijst
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
