/*
 * Laadt foto's rechtstreeks uit Firebase Storage via de publieke URL.
 * De Firebase-SDK is hiervoor niet nodig, dus er wordt niets extra gedownload
 * en er is geen extra aanvraag per foto. De Storage Rules moeten wel lezen
 * toestaan (zoals nu al het geval is).
 *
 * Structuur in Storage:
 *   <album>/thumb/<bestandsnaam>     kleine versie voor in het raster
 *   <album>/normaal/<bestandsnaam>   grote versie voor in de lightbox
 */

const BUCKET = "fotos-op-de-website-638a2.firebasestorage.app";


export function getImagePath(album, filename, thumbnail = false) {
    const formaat = thumbnail ? "thumb" : "normaal";
    return `${album}/${formaat}/${filename}`;
}


export function getImageUrl(album, filename, thumbnail = false) {
    const path = getImagePath(album, filename, thumbnail);
    return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
}


/**
 * Laadt één foto in een bestaand <img>-element.
 * De klasse "firebase-image-loading" blijft staan tot de foto echt binnen is.
 */
export function loadImage(imageElement, album, filename, thumbnail = false) {
    const url = getImageUrl(album, filename, thumbnail);

    imageElement.classList.remove("firebase-image-error");
    imageElement.classList.add("firebase-image-loading");

    imageElement.onload = () => {
        imageElement.classList.remove("firebase-image-loading");
    };

    imageElement.onerror = () => {
        console.error(`Afbeelding kon niet geladen worden: ${url}`);
        imageElement.classList.remove("firebase-image-loading");
        imageElement.classList.add("firebase-image-error");
        imageElement.alt = "Afbeelding kon niet geladen worden";
    };

    imageElement.decoding = "async";
    imageElement.src = url;
}


/**
 * Laadt de thumbnail van elke <img> met data-album en data-foto:
 *
 *   <img data-album="BGL" data-foto="Groep1.webp" alt="...">
 */
export function loadAlbumImages(root = document) {
    root.querySelectorAll("img[data-album][data-foto]").forEach(element => {
        element.loading = "lazy"; // foto's buiten beeld pas laden als je scrolt
        loadImage(element, element.dataset.album, element.dataset.foto, true);
    });
}
