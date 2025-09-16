// Recebe mensagens (Correção de bugs do FireFox)
window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    const { action, key, value } = event.data;

    if (action === "get") {
        const stored = localStorage.getItem(key);
        event.source.postMessage({ action: "getResponse", key, value: stored }, event.origin);
    } else if (action === "set") {
        localStorage.setItem(key, value);
    }
});

/* FireBase: */
// Importa funções do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, get, remove, update, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
const firebaseConfig = {
    apiKey: "AIzaSyCWWVFgQu2RBg6Y3TylBqz7UtMRl1V7Tgc",
    authDomain: "jogoteoriadascoresfatec.firebaseapp.com",
    databaseURL: "https://jogoteoriadascoresfatec-default-rtdb.firebaseio.com",
    projectId: "jogoteoriadascoresfatec",
    storageBucket: "jogoteoriadascoresfatec.firebasestorage.app",
    messagingSenderId: "1029972349838",
    appId: "1:1029972349838:web:5ab64e63a30bf5e1594adf",
    measurementId: "G-6GDTJRFBVV"
};
// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


export { db, ref, push, set, onValue, get, remove, update, onDisconnect };
