// Startpunt voor elke pagina met Firebase-foto's (begeleiding, galerijen, ...).
// Op de pagina volstaat: <script type="module" src="../scripts/fotos.js"></script>

import { bouwGalerijen } from "./galerij.js";
import { loadAlbumImages } from "./firebaseImages.js";
import { initLightbox } from "./lightbox.js";

bouwGalerijen();   // eerst de tegels maken (doet niets op pagina's zonder galerij)
loadAlbumImages(); // dan alle thumbnails laden
initLightbox();    // en klik-om-te-vergroten aanzetten
