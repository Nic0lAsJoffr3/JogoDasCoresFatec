function Player(respostasStr) {
    // 'respostasStr' é uma string, ex: "01" ou "26"
    for (let i = 0; i < 6; i++) {
        const checkbox = document.getElementById(`opcao${i + 1}`);
        checkbox.checked = respostasStr.includes(i.toString());
    }
}

function Responder() {
    setTimeout(() => {
        // Monta a string das respostas marcadas
        let selecionadas = "";
        document.querySelectorAll('input[name="resposta"]:checked').forEach((el) => {
            selecionadas += el.value; // concatena direto como string
        });
        // Salva como string (ex.: "01", "26")
        setLocalStorage("RespostaDoJogador", selecionadas);
    }, 700);
}

function Tv() {
    for (let i = 0; i < 6; i++) {
        document.getElementById(`opcao${i + 1}`).disabled = true;
    }
}

function TvFimDeJogo() {
    getLocalStorage("RespostaCorreta", (resposta) => {
        // 'resposta' é string, ex: "05"
        for (let i = 0; i < 6; i++) {
            const elemento = document.getElementById(`opcao${i + 1}`);
            elemento.classList.add(
                resposta.includes(i.toString()) ? "CorretaTv" : "ErradaTv"
            );
        }
    });
}

function PlayerEnd() {
    getLocalStorage("RespostaDoJogador", (resposta) => {
        const respostas = resposta ?? "";
        for (let i = 0; i < 6; i++) {
            const checkbox = document.getElementById(`opcao${i + 1}`);
            checkbox.disabled = true;
            checkbox.checked = respostas.includes(i.toString());
        }
        setLocalStorage("RespostaDoJogador", "");
    });

    getLocalStorage("RespostaCorreta", (resposta) => {
        const corretas = resposta ?? "";
        for (let i = 0; i < 6; i++) {
            const elemento = document.getElementById(`opcao${i + 1}`);
            elemento.classList.add(
                corretas.includes(i.toString()) ? "Correta" : "Errada"
            );
        }
    });
}
