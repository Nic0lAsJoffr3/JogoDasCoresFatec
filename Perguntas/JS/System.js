// Componentes exenciais //
const H1EsperandoJogadores = document.createElement("h1");
const EsperandoJogadores = document.createElement("div");

H1EsperandoJogadores.innerText = "Esperando outros jogadores responderem";
EsperandoJogadores.appendChild(H1EsperandoJogadores);
EsperandoJogadores.id = "EsperandoJogadores";
EsperandoJogadores.style.display = "none";

document.body.appendChild(EsperandoJogadores);

// System //
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

const params = new URLSearchParams(window.location.search);
const type = params.get("type");
const RespostasGerais = params.get("Respostas");
let RespostaJogador = -1;

var pontos = ".";
var reduzir = false;

// -------- Player ---------- //
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
// -------- TV ---------- //
if (type === "Tv" || type === "TvFimDeJogo") {
    document.querySelectorAll("label").forEach(label => label.classList.add("TVDisplay"));
    document.querySelectorAll("input").forEach(input => input.style.display = "none");
    document.getElementById("EnviarResposta").style.display = "none";
    Tv();
}

// -------- TvFimDeJogo ---------- //
if (type === "TvFimDeJogo") {
    const ListaRespostas = RespostasGerais.split(",").map(Number);
    let i = 0;
    document.querySelectorAll(".PorcentagemSelecionados").forEach(item => {
        let porcentagem = ListaRespostas.filter(itemList => itemList == i).length / ListaRespostas.filter(itemList => itemList != -1).length * 100;
        porcentagem = Math.round(porcentagem);
        item.style.display = "block";
        item.innerText = porcentagem + "%";
        i++;
    });
    TvFimDeJogo();
}
// -------- PlayerEnd ---------- //
if (type === "PlayerEnd") {
    document.getElementById("EnviarResposta").style.display = "none";
    PlayerEnd();
}