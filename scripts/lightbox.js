import { loadImage } from "./firebaseImages.js";

let modal = null;
let modalImage = null;


// De modal wordt pas gemaakt bij de eerste klik. Pagina's hoeven er dus geen HTML voor te hebben.
function ensureModal() {
    if (modal) return;

    const element = document.createElement("div");
    element.className = "modal fade";
    element.tabIndex = -1;
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content bg-transparent border-0">
                <div class="modal-body p-0 text-center position-relative">
                    <button type="button"
                            class="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                            data-bs-dismiss="modal" aria-label="Sluiten"></button>
                    <img alt="" class="img-fluid rounded">
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(element);

    modalImage = element.querySelector("img");
    modal = new bootstrap.Modal(element);

    // Bij sluiten de foto wissen, zodat de volgende niet even de vorige toont.
    element.addEventListener("hidden.bs.modal", () => {
        modalImage.removeAttribute("src");
    });
}


/**
 * Zet de lightbox aan voor de hele pagina.
 *
 * Werkt met event delegation: elke <img data-album data-foto> opent bij een
 * klik de normale versie, ook als die pas later aan de pagina wordt toegevoegd
 * (handig voor galerijen die uit een lijst worden opgebouwd).
 */
export function initLightbox() {
    document.addEventListener("click", event => {
        const thumbnail = event.target.closest("img[data-album][data-foto]");

        if (!thumbnail || thumbnail.classList.contains("firebase-image-error")) {
            return;
        }

        ensureModal();

        modalImage.removeAttribute("src");
        modalImage.alt = thumbnail.alt;
        modal.show();

        loadImage(modalImage, thumbnail.dataset.album, thumbnail.dataset.foto, false);
    });
}
