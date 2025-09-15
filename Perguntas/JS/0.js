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

    // -------- Player ----------
    if (type === "Player") {
        getLocalStorage("RespostaDoJogador", (resposta) => {
            RespostaJogador = resposta ?? -1;
            for (let i = 0; i < 6; i++) {
                document.getElementById(`opcao${i + 1}`).checked = (i == RespostaJogador);
            }
            if (RespostaJogador != -1) {
                document.getElementById("AreaQuestionario").style.display = "none";
                document.getElementById("EsperandoJogadores").style.display = "block";
            }
        });
    }

    function Responder() {
        RespostaJogador = document.querySelector('input[name="resposta"]:checked')?.value ?? -1;
        if (RespostaJogador != -1) {
            document.getElementById("AreaQuestionario").style.display = "none";
            document.getElementById("EsperandoJogadores").style.display = "block";
        }
        setLocalStorage("RespostaDoJogador", RespostaJogador);
    }

    // -------- TV ----------
    if (type === "Tv" || type === "TvFimDeJogo") {
        document.querySelectorAll("label").forEach(label => label.classList.add("TVDisplay"));
        document.querySelectorAll("input").forEach(input => input.style.display = "none");
        for (let i = 0; i < 6; i++)
            document.getElementById(`opcao${i + 1}`).disabled = true;
        document.getElementById("EnviarResposta").style.display = "none";
    }

    // -------- TvFimDeJogo ----------
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

        getLocalStorage("RespostaCorreta", (resposta) => {
            for (let i = 0; i < 6; i++) {
                document.getElementById(`opcao${i + 1}`).classList.add(
                    resposta == i ? "CorretaTv" : "ErradaTv"
                );
            }
        });
    }

    // -------- PlayerEnd ----------
    if (type === "PlayerEnd") {
        document.getElementById("EnviarResposta").style.display = "none";

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