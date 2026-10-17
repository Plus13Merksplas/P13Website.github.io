import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import {
    getStorage,
    ref,
    getDownloadURL,
    listAll
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

export async function loadImage(folder, filename, imgId) {

    const fileRef = ref(storage, `${folder}/${filename}`);

    const url = await getDownloadURL(fileRef);

    document.getElementById(imgId).src = url;
}