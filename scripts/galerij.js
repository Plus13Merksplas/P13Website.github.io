/*
 * Bouwt een fotoraster op uit een container zoals:
 *
 *   <div class="row g-2"
 *        data-galerij="2026-2027/Start"
 *        data-aantal="24"
 *        data-titel="Start 2026-2027"></div>
 *
 * Er worden tegels gemaakt voor 0001.webp t/m 0024.webp. Foto's die niet
 * bestaan (bijvoorbeeld bij een te hoog aantal) verdwijnen uit het raster.
 */

const CIJFERS = 4; // moet overeenkomen met ID_DIGITS in het Python-script


export function bouwGalerijen(root = document) {
    root.querySelectorAll("[data-galerij]").forEach(container => {
        const album = container.dataset.galerij;
        const aantal = parseInt(container.dataset.aantal, 10);
        const titel = container.dataset.titel || "Foto";

        if (!Number.isInteger(aantal) || aantal < 1) {
            console.error("Galerij heeft geen geldig data-aantal:", container);
            return;
        }

        for (let nummer = 1; nummer <= aantal; nummer++) {
            const bestandsnaam = `${String(nummer).padStart(CIJFERS, "0")}.webp`;

            const kolom = document.createElement("div");
            kolom.className = "col-6 col-md-4 col-lg-3";

            const kader = document.createElement("div");
            kader.className = "ratio ratio-1x1";

            const foto = document.createElement("img");
            foto.className = "foto-thumb object-fit-cover";
            foto.dataset.album = album;
            foto.dataset.foto = bestandsnaam;
            foto.alt = `${titel}, foto ${nummer}`;

            // Bestaat de foto niet, dan haal je de lege tegel weer weg.
            foto.addEventListener("error", () => kolom.remove());

            kader.appendChild(foto);
            kolom.appendChild(kader);
            container.appendChild(kolom);
        }
    });
}
