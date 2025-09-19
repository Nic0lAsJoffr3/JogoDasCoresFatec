// ---------------- COMPONENTES ---------------- //
const H1Esperando = document.createElement("h1");
H1Esperando.innerText = "Esperando outros jogadores responderem";

const EsperandoJogadores = document.createElement("div");
EsperandoJogadores.id = "EsperandoJogadores";
EsperandoJogadores.style.display = "none";
EsperandoJogadores.appendChild(H1Esperando);
document.body.appendChild(EsperandoJogadores);

// ---------------- LOCALSTORAGE VIA postMessage ---------------- //
function getLocalStorage(key, callback) {
    function handler(event) {
        if (event.data.action === "getResponse" && event.data.key === key) {
            callback(event.data.value);
            window.removeEventListener("message", handler);
        }
    }
    window.addEventListener("message", handler);
    parent.postMessage({ action: "get", key }, window.origin);
}

function setLocalStorage(key, value) {
    parent.postMessage({ action: "set", key, value }, window.origin);
}

// ---------------- PARAMS ---------------- //
const params = new URLSearchParams(window.location.search);
const type = params.get("type");
const RespostasGerais = params.get("Respostas");
let RespostaJogador = -1;

// ---------------- PLAYER ---------------- //
if (type === "Player") {
    getLocalStorage("RespostaDoJogador", (resposta) => {
        RespostaJogador = resposta ?? -1;
        Player(RespostaJogador);
        if (RespostaJogador != -1) {
            document.getElementById("AreaQuestionario").style.display = "none";
            document.getElementById("EsperandoJogadores").style.display = "block";
        }
    });
}

// ---------------- TV ---------------- //
if (type === "Tv" || type === "TvFimDeJogo") {
    document.querySelectorAll("label").forEach(label => label.classList.add("TVDisplay"));
    document.querySelectorAll("input").forEach(input => input.style.display = "none");
    const btnEnviar = document.getElementById("EnviarResposta");
    if (btnEnviar) btnEnviar.style.display = "none";

    Tv();
}

// ---------------- TV FIM DE JOGO ---------------- //
if (type === "TvFimDeJogo" && RespostasGerais) {
    let ListaRespostas = [];
    try {
        ListaRespostas = JSON.parse(decodeURIComponent(RespostasGerais));
    } catch (e) {
        console.error("Erro ao ler ListaRespostas:", e);
        ListaRespostas = [];
    }

     const respostasPorJogador = ListaRespostas.map(r => {
         if (typeof r === "string") return r.split("").map(n => parseInt(n, 10));
         return Array.isArray(r) ? r : [];
     }).filter(arr => arr.length && arr.every(n => typeof n === "number" && !isNaN(n) && n !== -1));

    const contagem = {};
     respostasPorJogador.forEach(respJogador => {
         respJogador.forEach(r => {
             if (!contagem[r]) contagem[r] = 0;
             contagem[r]++;
         });
     });

    const totalJogadores = respostasPorJogador.length;
document.querySelectorAll(".PorcentagemSelecionados").forEach((item, i) => {
    const quantidade = contagem[i] || 0;
    const porcentagem = totalJogadores > 0 ? Math.round((quantidade / totalJogadores) * 100) : 0;
    item.style.display = "block";
    item.innerText = porcentagem + "%";
});

    TvFimDeJogo();
}


// ---------------- PLAYER END ---------------- //
if (type === "PlayerEnd") {
    const btnEnviar = document.getElementById("EnviarResposta");
    if (btnEnviar) btnEnviar.style.display = "none";
    PlayerEnd();
}
