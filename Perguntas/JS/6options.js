function Player(RespostaJogador) {
    for (let i = 0; i < 6; i++) {
        document.getElementById(`opcao${i + 1}`).checked = (i == RespostaJogador);
    }
}
function Responder() {
    setTimeout(() => {
        RespostaJogador = document.querySelector('input[name="resposta"]:checked')?.value ?? -1;
        if (RespostaJogador != -1) {
            document.getElementById("AreaQuestionario").style.display = "none";
            document.getElementById("EsperandoJogadores").style.display = "block";
        }
        setLocalStorage("RespostaDoJogador", RespostaJogador);
    }, 0.7);
}
function Tv() {
    for (let i = 0; i < 6; i++)
        document.getElementById(`opcao${i + 1}`).disabled = true;
}
function TvFimDeJogo() {
    getLocalStorage("RespostaCorreta", (resposta) => {
        for (let i = 0; i < 6; i++) {
            document.getElementById(`opcao${i + 1}`).classList.add(
                resposta == i ? "CorretaTv" : "ErradaTv"
            );
        }
    });
}
function PlayerEnd() {
    getLocalStorage("RespostaDoJogador", (resposta) => {
        RespostaJogador = resposta ?? -1;
        for (let i = 0; i < 6; i++) {
            document.getElementById(`opcao${i + 1}`).disabled = true;
            document.getElementById(`opcao${i + 1}`).checked = (i == RespostaJogador);
        }
        setLocalStorage("RespostaDoJogador", -1);
    });
    getLocalStorage("RespostaCorreta", (resposta) => {
        for (let i = 0; i < 6; i++) {
            document.getElementById(`opcao${i + 1}`).classList.add(
                resposta == i ? "Correta" : "Errada"
            );
        }
    });
}