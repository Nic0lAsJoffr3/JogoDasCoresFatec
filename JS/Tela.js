// Recebe mensagens do iframe
window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return; // segurança
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
// Configuração do seu projeto
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

let jogoRef = ref(db, "Host");
let tempoRef = 0, Tempo = 0;
let tempoDaPergunta;
let RespostasID;
let Resposta;
let FimDeTempo = false;
let RespostaJogador;
onValue(jogoRef, (snapshot) => {
    const dados = snapshot.val();
    if (!dados.PerguntasStart) {
        document.getElementById("Perguntas").innerHTML = `<h1>Esperando mais Jogadores...</h1> \n <img class="QRcode" src='./IMG/QR.jpeg'>`
        return;
    }
    tempoRef = dados.Time;
    //Logica das perguntas
    RespostasID = dados.PerguntasID;
    document.getElementById("Perguntas").innerHTML = `<iframe class="IPergunta" src="./Perguntas/${RespostasID}.html?type=Tv"></iframe>`;

});
let TodasAsRespostas = []
setInterval(() => {
    if (FimDeTempo) {
        document.getElementById("Jogadores").classList.remove("JogadoresRespostas");
    }
    if (RespostasID == -1)
        return;

    let respostaRef = ref(db, "Respostas");
    get(respostaRef).then((snapshot) => {
        if (snapshot.exists()) {
            let dados = snapshot.val();
            tempoDaPergunta = dados[RespostasID].Time;
            localStorage.setItem("RespostaCorreta", dados[RespostasID].Resposta)

        }
    });
    if (tempoRef > 1 && tempoDaPergunta > 0) {
        Tempo -= tempoRef - Date.now() + tempoDaPergunta * 1000;
        Tempo /= 1000;
        Tempo = -Math.ceil(Tempo);
    }
    else return;
    if (Tempo >= 0) {
        FimDeTempo = false;
        const minutos = Math.floor(Tempo / 60);
        const segundos = Tempo % 60;
        const textoTime = (minutos > 9 ? minutos : "0" + minutos) + ":" + (segundos > 9 ? segundos : "0" + segundos);
        document.getElementById("Time").innerText = textoTime;
        document.getElementById("Jogadores").classList.remove("JogadoresRespostas");
    }
    else if (!FimDeTempo) {
        document.getElementById("Perguntas").innerHTML = `<iframe class="IPergunta" src="./Perguntas/${RespostasID}.html?type=TvFimDeJogo&Respostas=${TodasAsRespostas}"></iframe>`;
        FimDeTempo = true;
    }
    else {
        document.getElementById("Jogadores").classList.add("JogadoresRespostas");
    }
}, 1000);
// Referência para os jogadores no DB
const jogadoresRef = ref(db, "Jogadores");
let RespotaCorreta = -1;
// Escuta mudanças em tempo real
onValue(jogadoresRef, (snapshot) => {
    const dados = snapshot.val();
    const nameContainer = document.getElementById("Jogadores");
    nameContainer.innerHTML = ""; // limpa antes de atualizar

    if (dados) {
        // Transforma em array para poder ordenar
        const jogadores = Object.values(dados);

        // Ordena por pontos (desc) e nome (asc)
        jogadores.sort((a, b) => {
            if (b.pontos !== a.pontos) {
                return b.pontos - a.pontos; // maior pontuação primeiro
            }
            return a.nome.localeCompare(b.nome); // se empate, ordem alfabética
        });

        // Limpa container antes de renderizar
        nameContainer.innerHTML = "";

        // Renderiza os jogadores já ordenados
        jogadores.forEach((jogador) => {
            if (!jogador.perguntas) return;

            const div = document.createElement("div");
            div.classList.add("jogadorName");
            div.classList.remove("WaitRespostas", "CorretaRespostas", "ErradaRespostas");

            const RespotaCorreta = localStorage.getItem("RespostaCorreta");

            if (jogador.perguntas[RespostasID] == -1) {
                div.classList.add("WaitRespostas");
            } else if (jogador.perguntas[RespostasID] == RespotaCorreta) {
                div.classList.add("CorretaRespostas");
            } else {
                div.classList.add("ErradaRespostas");
            }

            if (RespostasID != -1 && jogador.perguntas[RespostasID] != -1) {
                TodasAsRespostas[RespostasID] = jogador.perguntas[RespostasID];
            }

            div.textContent = `${jogador.nome}: ${jogador.pontos}`;
            nameContainer.appendChild(div);
        });
    } else {
        nameContainer.textContent = "Nenhum jogador conectado.";
    }
});