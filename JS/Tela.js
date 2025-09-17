import { db, ref, onValue, get } from "./System.js";

// ---------------- FUNÇÃO AUXILIAR ---------------- //
function normalizarResposta(resp) {
    if (resp == null || resp === -1 || resp === "null") return [-1];

    if (typeof resp === "number") {
        return [resp]; // já é número
    }

    if (typeof resp === "string") {
        // "03" -> ["0","3"] -> [0,3]
        return resp.split("").map(n => parseInt(n, 10));
    }

    return [-1];
}

// ---------------- VARIÁVEIS ---------------- //
let jogoRef = ref(db, "Host");
let jogadoresRef = ref(db, "Jogadores");
let tempoRef = 0, Tempo = 0;
let tempoDaPergunta;
let RespostasID = -1;
let AntigaRespostaID = -2;
let FimDeTempo = false;
let TodasAsRespostas = [];

// ---------------- ESCUTA HOST ---------------- //
onValue(jogoRef, (snapshot) => {
    const dados = snapshot.val();
    if (!dados.PerguntasStart) {
        document.getElementById("Perguntas").innerHTML = `
            <h1>Esperando mais Jogadores...</h1>
            <img class="QRcode" src='./IMG/QR.jpeg'>
        `;
        return;
    }

    tempoRef = dados.Time;
    RespostasID = dados.PerguntasID;

    // Resetar respostas quando trocar de pergunta
    if (RespostasID !== AntigaRespostaID) {
        AntigaRespostaID = RespostasID;
        TodasAsRespostas = [];
    }

    document.getElementById("Perguntas").innerHTML = `
        <iframe class="IPergunta" src="./Perguntas/${RespostasID}.html?type=Tv"></iframe>
    `;
});

// ---------------- CONTROLE DE TEMPO ---------------- //
setInterval(() => {
    if (RespostasID === -1) return;

    const respostaRef = ref(db, "Respostas");
    get(respostaRef).then((snapshot) => {
        if (!snapshot.exists()) return;
        const dados = snapshot.val();
        tempoDaPergunta = dados[RespostasID].Time;
        localStorage.setItem("RespostaCorreta", JSON.stringify(normalizarResposta(dados[RespostasID].Resposta)));
    });

    if (!tempoRef || !tempoDaPergunta) return;

    const tempoRestanteMs = tempoDaPergunta * 1000 - (Date.now() - tempoRef);
    if (tempoRestanteMs > 0) {
        Tempo = Math.ceil(tempoRestanteMs / 1000);
        FimDeTempo = false;
        const minutos = Math.floor(Tempo / 60);
        const segundos = Tempo % 60;
        const textoTime = (minutos > 9 ? minutos : "0" + minutos) + ":" + (segundos > 9 ? segundos : "0" + segundos);
        document.getElementById("Time").innerText = textoTime;
        document.getElementById("Jogadores").classList.remove("JogadoresRespostas");
    } else if (!FimDeTempo) {
        document.getElementById("Perguntas").innerHTML = `
            <iframe class="IPergunta" src="./Perguntas/${RespostasID}.html?type=TvFimDeJogo&Respostas=${encodeURIComponent(JSON.stringify(TodasAsRespostas))}"></iframe>
        `;
        FimDeTempo = true;
    } else {
        document.getElementById("Jogadores").classList.add("JogadoresRespostas");
    }
}, 1000);

// ---------------- ESCUTA JOGADORES ---------------- //
onValue(jogadoresRef, (snapshot) => {
    const dados = snapshot.val();
    const container = document.getElementById("Jogadores");
    container.innerHTML = "";

    if (!dados) {
        container.textContent = "Nenhum jogador conectado.";
        return;
    }

    const jogadores = Object.values(dados);

    // Ordena por pontos e nome
    jogadores.sort((a, b) => (b.pontos !== a.pontos ? b.pontos - a.pontos : a.nome.localeCompare(b.nome)));

    jogadores.forEach((jogador) => {
        if (!jogador.perguntas) return;

        const div = document.createElement("div");
        div.classList.add("jogadorName");

        const respostaCorreta = JSON.parse(localStorage.getItem("RespostaCorreta") || "[-1]");
        const respostaJogador = normalizarResposta(jogador.perguntas[RespostasID]);

        if (respostaJogador.includes(-1)) {
            div.classList.add("WaitRespostas");
        } else if (respostaJogador.some(r => respostaCorreta.includes(r))) {
            div.classList.add("CorretaRespostas");
        } else {
            div.classList.add("ErradaRespostas");
        }

        if (RespostasID !== -1 && !respostaJogador.includes(-1)) {
            respostaJogador.forEach(r => TodasAsRespostas.push(r));
        }

        div.textContent = `${jogador.nome}: ${jogador.pontos}`;
        container.appendChild(div);
    });
});

// ---------------- POSTMESSAGE HANDLER PARA IFRAME ---------------- //
window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || !data.action) return;

    if (data.action === "get") {
        const value = localStorage.getItem(data.key);
        event.source.postMessage({ action: "getResponse", key: data.key, value }, event.origin);
    }

    if (data.action === "set") {
        localStorage.setItem(data.key, data.value);
    }
});
