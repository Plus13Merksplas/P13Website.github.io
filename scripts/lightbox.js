import { loadImage, getImageUrl } from "./firebaseImages.js";

let modal = null;
let modalImage = null;
let teller = null;
let vorigeKnop = null;
let volgendeKnop = null;

let groep = [];   // alle thumbnails van het album waarin je klikte
let index = 0;    // welke foto nu getoond wordt
let isOpen = false;

// Eigen stijl, omdat jouw style.css van elke .btn 100% breed maakt.
const PIJL_STIJL = `
    position:absolute; top:50%; transform:translateY(-50%); z-index:5;
    width:44px; height:44px; border:0; border-radius:50%;
    background:rgba(0,0,0,.55); color:#fff; font-size:2rem; line-height:1;
    padding:0 0 4px 0; display:flex; align-items:center; justify-content:center;
    cursor:pointer;
`;


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
                            style="z-index:5"
                            data-bs-dismiss="modal" aria-label="Sluiten"></button>

                    <button type="button" class="lightbox-vorige" aria-label="Vorige foto"
                            style="${PIJL_STIJL} left:.5rem">&#8249;</button>
                    <button type="button" class="lightbox-volgende" aria-label="Volgende foto"
                            style="${PIJL_STIJL} right:.5rem">&#8250;</button>

                    <img alt="" class="img-fluid rounded" style="max-height:90vh">

                    <span class="badge text-bg-dark position-absolute bottom-0 start-50 translate-middle-x mb-2"></span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(element);

    modalImage = element.querySelector("img");
    teller = element.querySelector(".badge");
    vorigeKnop = element.querySelector(".lightbox-vorige");
    volgendeKnop = element.querySelector(".lightbox-volgende");
    modal = new bootstrap.Modal(element);

    vorigeKnop.addEventListener("click", () => toon(index - 1));
    volgendeKnop.addEventListener("click", () => toon(index + 1));

    element.addEventListener("shown.bs.modal", () => { isOpen = true; });
    element.addEventListener("hidden.bs.modal", () => {
        isOpen = false;
        modalImage.removeAttribute("src"); // volgende keer niet even de vorige foto tonen
    });

    // Pijltjestoetsen op het toetsenbord
    document.addEventListener("keydown", event => {
        if (!isOpen) return;
        if (event.key === "ArrowLeft") toon(index - 1);
        if (event.key === "ArrowRight") toon(index + 1);
    });

    // Vegen op gsm
    const body = element.querySelector(".modal-body");
    let startX = null;

    body.addEventListener("touchstart", event => {
        startX = event.changedTouches[0].clientX;
    }, { passive: true });

    body.addEventListener("touchend", event => {
        if (startX === null) return;
        const verschil = event.changedTouches[0].clientX - startX;
        startX = null;

        if (Math.abs(verschil) > 50) {
            toon(index + (verschil < 0 ? 1 : -1));
        }
    });
}


// Toont foto nummer i van de groep. Na de laatste foto begin je weer bij de eerste.
function toon(nieuweIndex) {
    index = (nieuweIndex + groep.length) % groep.length;

    const thumbnail = groep[index];
    modalImage.alt = thumbnail.alt;
    loadImage(modalImage, thumbnail.dataset.album, thumbnail.dataset.foto, false);

    teller.textContent = `${index + 1} / ${groep.length}`;

    const metPijlen = groep.length > 1;
    vorigeKnop.style.display = metPijlen ? "flex" : "none";
    volgendeKnop.style.display = metPijlen ? "flex" : "none";
    teller.style.display = metPijlen ? "" : "none";

    // De volgende en vorige foto alvast ophalen, zodat bladeren snel gaat.
    if (metPijlen) {
        [index + 1, index - 1].forEach(i => {
            const buur = groep[(i + groep.length) % groep.length];
            new Image().src = getImageUrl(buur.dataset.album, buur.dataset.foto, false);
        });
    }
}


// Alle thumbnails van hetzelfde album, in de volgorde van de pagina.
function verzamelGroep(thumbnail) {
    return Array.from(document.querySelectorAll("img[data-album][data-foto]"))
        .filter(img =>
            img.dataset.album === thumbnail.dataset.album &&
            !img.classList.contains("firebase-image-error")
        );
}


/**
 * Zet de lightbox aan voor de hele pagina.
 *
 * Werkt met event delegation: elke <img data-album data-foto> opent bij een
 * klik de normale versie, ook als die pas later aan de pagina wordt toegevoegd.
 */
export function initLightbox() {
    document.addEventListener("click", event => {
        const thumbnail = event.target.closest("img[data-album][data-foto]");

        if (!thumbnail || thumbnail.classList.contains("firebase-image-error")) {
            return;
        }

        ensureModal();

        groep = verzamelGroep(thumbnail);

        modalImage.removeAttribute("src");
        modal.show();
        toon(groep.indexOf(thumbnail));
    });
}
