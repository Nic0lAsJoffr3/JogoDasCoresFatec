// importa conexão com banco de dados //
import { db, ref, push, set, onValue, get, remove, update, onDisconnect } from "./System.js";

//-----Var-----//

// let //
let JogadorOnline = false;
let tempoRef;
let jogoRef = ref(db, "Host");
let respostaRef = ref(db, "Respostas");
let pontosGravados = -1; // pontos calculados para a pergunta atual
let FimDeTempo = false;
let Tempo = 0;
let tempoDaPergunta = 0;
let RespostaIDLocal = -1;
let RespostaIDLocalAntiga = -1;
// Atualizar dados caso tenha mudanças no "Host" //
onValue(jogoRef, (snapshot) => {
    const dados = snapshot.val();
    atualizarJogo(dados);
});

// Flag global para controlar pontuação por pergunta
let respondeuPorPergunta = {};

setInterval(() => {

    // Inicializa localStorage que não existem
    if (localStorage.getItem("RespostaID") == null) localStorage.setItem("RespostaID", -1);
    if (localStorage.getItem("RespostaDoJogador") == null) localStorage.setItem("RespostaDoJogador", -1);
    if (RespostaIDLocalAntiga != RespostaIDLocal) {
        localStorage.setItem("RespostaDoJogador", -1);
        RespostaIDLocalAntiga = RespostaIDLocal;
    }
    const jogadorRefKey = localStorage.getItem('jogadorRefKey');
    RespostaIDLocal = String(localStorage.getItem("RespostaID") || -1);
    const RespostaDoJogadorStr = localStorage.getItem("RespostaDoJogador") || -1;
    const Valor = Number(localStorage.getItem("ValorDaRespostaAtual")) || 1;

    if (!jogadorRefKey) return;
    const jogadorRef = ref(db, `Jogadores/${jogadorRefKey}/`);
    const jogadorRefPerguntas = ref(db, `Jogadores/${jogadorRefKey}/perguntas/`);

    // Atualiza dados do jogador
    get(jogadorRef).then(snapshot => {
        if (!snapshot.exists()) {
            // Jogador desconectado
            localStorage.removeItem('nomeJogador');
            localStorage.removeItem('jogadorRefKey');
            document.getElementById('off').style.display = 'none';
            document.querySelector('.Entrar').style.display = 'block';
            document.querySelector('.Main').style.display = 'none';
            document.querySelector(".Time").style.display = 'none';
            console.log("Jogador desconectado automaticamente (outra aba fechou)");
            return;
        }

        const dados = snapshot.val();

        // --- Normaliza a resposta correta e do jogador como arrays de números ---
        const respostaCorretaRaw = localStorage.getItem("RespostaCorreta") || "";
        const respostaCorretaArray = respostaCorretaRaw.split("").map(n => parseInt(n, 10));
        const respJogadorArray = String(RespostaDoJogadorStr).split("").map(n => parseInt(n, 10));

        // Grava a resposta do jogador se ainda não foi registrada
        if (RespostaDoJogadorStr && dados.perguntas[RespostaIDLocal] == -1) {
            if (RespostaDoJogadorStr == -1) return;
            update(jogadorRefPerguntas, { [RespostaIDLocal]: RespostaDoJogadorStr })
                .then(() => {
                    console.log(`Resposta ${RespostaDoJogadorStr} gravada para pergunta ${RespostaIDLocal}`)
                    localStorage.setItem("RespostaDoJogador", -1);
                    // Calcula pontos se acertou e ainda não pontuou essa pergunta

                    if (!respondeuPorPergunta[RespostaIDLocal] && respJogadorArray.length > 0) {
                        const totalCorretas = respostaCorretaArray.length;
                        // Conta acertos
                        const acertos = respJogadorArray.filter(r => respostaCorretaArray.includes(r)).length;

                        // Conta erros (respostas do jogador que não estão nas corretas)
                        const erros = respJogadorArray.filter(r => !respostaCorretaArray.includes(r)).length;

                        // Calcula percentual de acerto considerando penalização por erro
                        let percentualAcerto = acertos / totalCorretas - erros / totalCorretas;

                        // Garante que o percentual não seja negativo
                        percentualAcerto = Math.max(percentualAcerto, 0);

                        if (percentualAcerto > 0) {
                            pontosGravados = Math.max(Tempo, 0) * 123 * Valor * percentualAcerto;
                            respondeuPorPergunta[RespostaIDLocal] = true;
                        }
                    }
                    pontosGravados = Math.round(pontosGravados);
                    console.log(pontosGravados + "\n" + RespostaDoJogadorStr);
                })
                .catch(err => console.error("Erro ao gravar resposta:", err));
        }

        // Grava pontos no Firebase quando o tempo acabar
        if (FimDeTempo && pontosGravados > 0 && respJogadorArray.length > 0) {
            const novaPontuacao = (dados.pontos || 0) + pontosGravados;
            update(jogadorRef, { pontos: novaPontuacao })
                .then(() => {
                    console.log(`O jogador ${dados.nome} alcançou ${pontosGravados} pontos. Total: ${novaPontuacao}`);
                    pontosGravados = -1;
                })
                .catch(err => console.error("Erro ao gravar pontos:", err));
        }
    });

    if (RespostaIDLocal == -1) return;

    // Atualiza dados da pergunta
    get(respostaRef).then(snapshot => {
        if (snapshot.exists()) {
            const dadosPergunta = snapshot.val();
            tempoDaPergunta = dadosPergunta[RespostaIDLocal].Time;
            localStorage.setItem("RespostaCorreta", dadosPergunta[RespostaIDLocal].Resposta);
            localStorage.setItem("ValorDaRespostaAtual", dadosPergunta[RespostaIDLocal].Valor);
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

    // Quando o tempo acabar, vai para a tela final
    if (Tempo <= 0 && !FimDeTempo) {
        const iframe = document.querySelector('.IPergunta');
        if (!iframe || !iframe.src.includes("PlayerEnd")) {
            document.querySelector('.Main').innerHTML =
                `<iframe class="IPergunta" src="./Perguntas/${RespostaIDLocal}.html?type=PlayerEnd"></iframe>`;
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

// 16