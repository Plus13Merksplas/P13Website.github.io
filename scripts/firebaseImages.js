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


/*
 * Structuur in Firebase Storage:
 *
 *   <album>/thumb/<bestandsnaam>     kleine versie voor in het raster
 *   <album>/normaal/<bestandsnaam>   grote versie voor in de lightbox
 *
 * De bestandsnaam is voor beide versies gelijk en dient als sleutel.
 */
export function getImagePath(album, filename, thumbnail = false) {
    const formaat = thumbnail ? "thumb" : "normaal";
    return `${album}/${formaat}/${filename}`;
}


// Download-URL's onthouden, zodat dezelfde foto niet twee keer opgevraagd wordt.
const urlCache = new Map();

function getUrl(path) {
    if (!urlCache.has(path)) {
        const request = getDownloadURL(ref(storage, path)).catch(error => {
            urlCache.delete(path); // mislukte aanvragen niet bewaren
            throw error;
        });
        urlCache.set(path, request);
    }
    return urlCache.get(path);
}


/**
 * Laadt één foto in een bestaand <img>-element.
 *
 * @param {HTMLImageElement} imageElement
 * @param {string} album      Bijvoorbeeld "BGL" of "kamp_2026".
 * @param {string} filename   Bijvoorbeeld "Groep1.webp" of "0001.webp".
 * @param {boolean} thumbnail true = thumbnail, false = normale foto.
 */
export async function loadImage(imageElement, album, filename, thumbnail = false) {
    const path = getImagePath(album, filename, thumbnail);

    // Onthoud wat dit element het laatst gevraagd heeft. Zo kan een trage,
    // oudere aanvraag nooit een nieuwere foto overschrijven.
    imageElement.dataset.requested = path;
    imageElement.classList.remove("firebase-image-error");
    imageElement.classList.add("firebase-image-loading");

    try {
        const url = await getUrl(path);

        if (imageElement.dataset.requested === path) {
            imageElement.src = url;
        }
    } catch (error) {
        console.error(`Afbeelding kon niet geladen worden: ${path}`, error);

        if (imageElement.dataset.requested === path) {
            imageElement.classList.add("firebase-image-error");
            imageElement.alt = "Afbeelding kon niet geladen worden";
        }
    } finally {
        if (imageElement.dataset.requested === path) {
            imageElement.classList.remove("firebase-image-loading");
        }
    }
}


/**
 * Laadt de thumbnail van elke <img> met data-album en data-foto:
 *
 *   <img data-album="BGL" data-foto="Groep1.webp" alt="...">
 */
export function loadAlbumImages(root = document) {
    const elements = root.querySelectorAll("img[data-album][data-foto]");

    return Promise.allSettled(
        Array.from(elements).map(element =>
            loadImage(element, element.dataset.album, element.dataset.foto, true)
        )
    );
}
