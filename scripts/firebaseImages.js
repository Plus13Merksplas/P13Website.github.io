import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import {
    getStorage,
    ref,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";


const firebaseConfig = {
    apiKey: "AIzaSyDDR-vkIAvD6eNvV14dxG2Fag-f9NaLglY",
    authDomain: "fotos-op-de-website-638a2.firebaseapp.com",
    projectId: "fotos-op-de-website-638a2",
    storageBucket: "fotos-op-de-website-638a2.firebasestorage.app",
    messagingSenderId: "880514876224",
    appId: "1:880514876224:web:038930a8f60505be78b0a5"
};


const app = initializeApp(firebaseConfig);
const storage = getStorage(app);


/**
 * Laadt een afbeelding uit Firebase Storage.
 *
 * @param {string} firebasePath
 * Het volledige pad in Firebase Storage.
 *
 * @param {string} imgId
 * Het ID van het HTML img-element.
 */
export async function loadFirebaseImage(firebasePath, imgId) {
    const imageElement = document.getElementById(imgId);

    if (!imageElement) {
        console.error(
            `Geen HTML-element gevonden met id "${imgId}".`
        );
        return;
    }

    try {
        const imageReference = ref(storage, firebasePath);
        const downloadUrl = await getDownloadURL(imageReference);

        imageElement.src = downloadUrl;
        imageElement.classList.remove("firebase-image-loading");
    } catch (error) {
        console.error(
            `Afbeelding kon niet geladen worden: ${firebasePath}`,
            error
        );

        imageElement.classList.remove("firebase-image-loading");
        imageElement.classList.add("firebase-image-error");
        imageElement.alt = "Afbeelding kon niet geladen worden";
    }
}


/**
 * Laadt een begeleidingsfoto.
 *
 * Normale foto:
 * BGL/normaal/GROEP1.webp
 *
 * Thumbnail:
 * BGL/thumb/GROEP1.webp
 *
 * @param {string} filename
 * Bijvoorbeeld "GROEP1.webp".
 *
 * @param {string} imgId
 * ID van het HTML img-element.
 *
 * @param {boolean} thumbnail
 * true voor thumbnail, false voor normale foto.
 */
export async function loadBglImage(
    filename,
    imgId,
    thumbnail = false
) {
    const formaatMap = thumbnail ? "thumb" : "normaal";
    const firebasePath = `BGL/${formaatMap}/${filename}`;

    await loadFirebaseImage(firebasePath, imgId);
}


/**
 * Zoekt automatisch alle HTML-elementen met:
 *
 * data-bgl-image="GROEP1.webp"
 *
 * Voor een thumbnail voeg je toe:
 *
 * data-bgl-thumbnail="true"
 */
export async function loadAllBglImages() {
    const imageElements = document.querySelectorAll(
        "img[data-bgl-image]"
    );

    const loadingTasks = Array.from(imageElements).map(
        async imageElement => {
            const filename = imageElement.dataset.bglImage;
            const thumbnail =
                imageElement.dataset.bglThumbnail === "true";

            if (!imageElement.id) {
                console.error(
                    "Een BGL-afbeelding heeft geen HTML-id:",
                    imageElement
                );
                return;
            }

            await loadBglImage(
                filename,
                imageElement.id,
                thumbnail
            );
        }
    );

    await Promise.allSettled(loadingTasks);
}
