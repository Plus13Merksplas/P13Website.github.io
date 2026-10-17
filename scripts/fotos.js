// Startpunt voor elke pagina met Firebase-foto's (begeleiding, galerijen, ...).
// Op de pagina volstaat: <script type="module" src="../scripts/fotos.js"></script>

import { loadAlbumImages } from "./firebaseImages.js";
import { initLightbox } from "./lightbox.js";

loadAlbumImages();
initLightbox();
