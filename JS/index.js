// importa conexão com banco de dados //
import { db, ref, push, set, onValue, get, remove, update, onDisconnect } from "./System.js";

//-----Var-----//

// let //
let pontosGravados = -1;
let JogadorOnline = false;
let tempoRef;
let tempoDaPergunta;
let Tempo = 0;
let RespostasID = -1;
let FimDeTempo = false;
let jogoRef = ref(db, "Host");
let respostaRef = ref(db, "Respostas");

// Atualizar dados caso tenha mudanças no "Host" //
onValue(jogoRef, (snapshot) => {
    const dados = snapshot.val();
    atualizarJogo(dados);
});

// Função para enviar resposta do jogador
function enviarResposta(resposta) {
    const jogadorRefKey = localStorage.getItem('jogadorRefKey');
    const RespostaIDLocal = localStorage.getItem("RespostaID").toString();
    if (!jogadorRefKey || RespostaIDLocal == -1) return;

    const jogadorRefPerguntas = ref(db, `Jogadores/${jogadorRefKey}/perguntas/`);

    // Salva localmente e no Firebase
    localStorage.setItem("RespostaDoJogador", resposta);
    update(jogadorRefPerguntas, { [RespostaIDLocal]: resposta })
        .then(() => console.log("Resposta enviada"))
        .catch(err => console.error(err));
}

// Loop Geral //
setInterval(() => {
    // Cria localStorage que não existem //
    if (localStorage.getItem("RespostaID") == null) localStorage.setItem("RespostaID", -1);
    if (localStorage.getItem("RespostaDoJogador") == null) localStorage.setItem("RespostaDoJogador", -1);

    // Constantes //
    const jogadorRefKey = localStorage.getItem('jogadorRefKey');
    const RespostaIDLocal = String(localStorage.getItem("RespostaID") || -1);
    const RespostaDoJogador = localStorage.getItem("RespostaDoJogador");
    const Valor = Number(localStorage.getItem("ValorDaRespostaAtual")) || 1;

    if (!jogadorRefKey) return;

    const jogadorRef = ref(db, `Jogadores/${jogadorRefKey}/`);
    const jogadorRefPerguntas = ref(db, `Jogadores/${jogadorRefKey}/perguntas/`);

    // Atualiza dados do jogador
    get(jogadorRef).then(snapshot => {
        if (!snapshot.exists()) {
            // Nó removido por outra aba
            localStorage.removeItem('nomeJogador');
            localStorage.removeItem('jogadorRefKey');
            document.getElementById('off').style.display = 'none';
            document.querySelector('.Entrar').style.display = 'block';
            document.querySelector('.Main').style.display = 'none';
            document.querySelector(".Time").style.display = 'none';
            console.log("Jogador desconectado automaticamente (outra aba fechou)");
            JogadorOnline = false;
        } else {
            const dados = snapshot.val();

            // Grava a resposta do jogador se ele respondeu e ainda não foi registrada
            if (RespostaDoJogador != -1 && dados.perguntas[RespostaIDLocal] == -1) {
                update(jogadorRefPerguntas, {
                    [RespostaIDLocal]: RespostaDoJogador
                }).then(() => {
                    console.log(`Resposta ${RespostaDoJogador} gravada para pergunta ${RespostaIDLocal}`);
                }).catch(err => console.error("Erro ao gravar resposta:", err));
            }

            // Calcula pontos apenas se respondeu corretamente e ainda não gravou pontos
            if (RespostaDoJogador != -1 && RespostaDoJogador == localStorage.getItem("RespostaCorreta") && pontosGravados <= 0) {
                pontosGravados = Math.max(Tempo, 0) * 123 * Valor;
            }

            // Grava pontos no Firebase quando o tempo acabar
            if (FimDeTempo && pontosGravados > 0 && RespostaDoJogador != -1) {
                get(jogadorRef).then(snapshot => {
                    if (snapshot.exists()) {
                        const dados = snapshot.val();
                        const novaPontuacao = (dados.pontos || 0) + pontosGravados;
                        update(jogadorRef, { pontos: novaPontuacao });
                        console.log(`O jogador ${dados.nome} alcançou ${pontosGravados} pontos. Total: ${novaPontuacao}`);
                        pontosGravados = -1;
                    }
                });
            }
        }
    });

    if (RespostasID == -1) return;

    // Atualiza dados da pergunta
    get(respostaRef).then((snapshot) => {
        if (snapshot.exists()) {
            const dados = snapshot.val();
            tempoDaPergunta = dados[RespostasID].Time;
            localStorage.setItem("RespostaCorreta", dados[RespostasID].Resposta);
            localStorage.setItem("ValorDaRespostaAtual", dados[RespostasID].Valor);
        }
    });

    // Calcula tempo restante
    if (tempoRef > 1 && tempoDaPergunta > 0) {
        Tempo -= tempoRef - Date.now() + tempoDaPergunta * 1000;
        Tempo /= 1000;
        Tempo = Math.max(0, -Math.ceil(Tempo));
    } else return;

    // Atualiza timer visual
    if (Tempo >= 0) {
        FimDeTempo = false;
        const minutos = Math.floor(Tempo / 60);
        const segundos = Tempo % 60;
        const textoTime = (minutos > 9 ? minutos : "0" + minutos) + ":" + (segundos > 9 ? segundos : "0" + segundos);
        document.getElementById("Time").innerText = textoTime;
    }

    // Quando o tempo acabar, vai para a tela final (só se ainda não carregou)
    if (Tempo <= 0 && !FimDeTempo) {
        const iframe = document.querySelector('.IPergunta');
        if (!iframe || !iframe.src.includes("PlayerEnd")) {
            document.querySelector('.Main').innerHTML =
                `<iframe class="IPergunta" src="./Perguntas/${RespostasID}.html?type=PlayerEnd"></iframe>`;
        }
        FimDeTempo = true;
    }

}, 1000);


// Função Interna //
function atualizarJogo(dados) {
    document.getElementById("TituloInicial").style.display = "block";
    document.querySelector(".JogoStartdontgo").innerHTML = "";
    document.querySelector(".Main").innerHTML = "";
    document.getElementById("EntrarArea").style.display = "block";
    if (!(dados && dados.iniciado)) {
        SairDoJogo();
        document.querySelector(".ForaDoAr").style.display = 'block';
        document.querySelector(".Every").style.display = 'none';
        document.querySelector(".Time").style.display = 'none';
        return;
    }

    tempoRef = dados.Time;
    document.querySelector(".ForaDoAr").style.display = 'none';
    document.querySelector(".Every").style.display = 'block';
    document.querySelector('.Main').style.display = 'block';

    if (!JogadorOnline) {
        if (dados.PerguntasStart) {
            document.getElementById('EntrarArea').style.display = 'none';
            document.querySelector('.JogoStartdontgo').innerHTML =
                `<h1>Jogo já iniciado!</h1><br><h2>Espere o host iniciar novamente!</h2>`;
        } else {
            document.querySelector(".Time").style.display = 'none';
            document.querySelector('.Main').innerHTML =
                `<div class="EsperandoDiv"><h1>Esperando a Partida Começar</h1></div>`;
        }
        return;
    }
    if (dados.PerguntasStart) {
        document.getElementById("TituloInicial").style.display = "none";
        // só cria o iframe se ainda não existir ou se mudou de pergunta
        const iframe = document.querySelector('.IPergunta');
        if (!iframe || !iframe.src.includes(`Perguntas/${dados.PerguntasID}.html?type=Player`)) {
            document.querySelector('.Main').innerHTML =
                `<iframe class="IPergunta" src="./Perguntas/${dados.PerguntasID}.html?type=Player"></iframe>`;
        }
        document.querySelector(".Time").style.display = 'block';
        RespostasID = dados.PerguntasID;
        localStorage.setItem("RespostaID", dados.PerguntasID);
    } else {
        document.querySelector(".Time").style.display = 'none';
        document.querySelector('.Main').innerHTML =
            `<div class="EsperandoDiv"><h1>Esperando a Partida Começar</h1></div>`;
    }
}

function Reiniciar() {
    get(jogoRef).then(snapshot => {
        if (snapshot.exists()) {
            const dados = snapshot.val();
            atualizarJogo(dados);
        }
    }).catch(erro => console.error("Erro ao reiniciar:", erro));
}

// Funções Externas //
window.addEventListener('load', () => {
    const nome = localStorage.getItem('nomeJogador');
    const jogadorRefKey = localStorage.getItem('jogadorRefKey');

    if (nome && jogadorRefKey) {
        const jogadorRef = ref(db, `Jogadores/${jogadorRefKey}`);

        set(jogadorRef, {
            nome: nome,
            perguntas: { "0": -1, "1": -1, "2": -1, "3": -1, "4": -1, "5": -1, "6": -1, "7": -1, "8": -1, "9": -1, "10": -1, "11": -1, "12": -1, "13": -1, "14": -1, "15": -1 },
            pontos: 0
        })
            .then(() => { console.log("Jogador reconectado automaticamente"); JogadorOnline = true; })
            .catch(err => console.error(err));

        onDisconnect(jogadorRef).remove();
        document.getElementById('off').style.display = 'block';
        document.querySelector('.Entrar').style.display = 'none';
        document.querySelector('.Main').style.display = 'block';
        document.querySelector(".Time").style.display = 'none';
        Reiniciar();
    }
});

window.EntrarNoJogo = function (name) {
    const jogadoresRef = ref(db, 'Jogadores');
    const novoJogadorRef = push(jogadoresRef); // cria nó único
    localStorage.setItem('jogadorRefKey', novoJogadorRef.key);

    set(novoJogadorRef, {
        nome: name,
        perguntas: { "0": -1, "1": -1, "2": -1, "3": -1, "4": -1, "5": -1, "6": -1, "7": -1, "8": -1, "9": -1, "10": -1, "11": -1, "12": -1, "13": -1, "14": -1, "15": -1 },
        pontos: 0
    })
        .then(() => { console.log("Jogador entrou no jogo"); JogadorOnline = true; })
        .catch(err => console.error(err));

    Reiniciar();
    onDisconnect(novoJogadorRef).remove();
}

// Remove jogador manualmente (sem recarregar a página)
window.SairDoJogo = function () {
    const jogadorRefKey = localStorage.getItem('jogadorRefKey');
    if (!jogadorRefKey) return;

    const jogadorRef = ref(db, `Jogadores/${jogadorRefKey}`);
    remove(jogadorRef).catch(err => console.error(err));

    JogadorOnline = false;
    console.log("Jogador desconectado");

    // Limpa a tela sem recarregar
    document.querySelector(".Main").innerHTML = "";
    document.getElementById('off').style.display = 'none';
    document.querySelector('.Entrar').style.display = 'block';
    document.querySelector(".Time").style.display = 'none';

    localStorage.removeItem('jogadorRefKey');
    localStorage.removeItem('nomeJogador');
    localStorage.setItem("RespostaDoJogador", -1);
    localStorage.setItem("RespostaID", -1);
}
