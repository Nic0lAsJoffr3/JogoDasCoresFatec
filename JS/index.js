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

// Loop Geral //

setInterval(() => {
    // Cria localStorage que não existem //
    if (localStorage.getItem("RespostaID") == null) localStorage.setItem("RespostaID", -1);
    if (localStorage.getItem("RespostaDoJogador") == null) localStorage.setItem("RespostaDoJogador", -1);

    // Const //

    const jogadorRefKey = localStorage.getItem('jogadorRefKey');
    const RespostaIDLocal = localStorage.getItem("RespostaID").toString();
    const RespostaDoJogador = localStorage.getItem("RespostaDoJogador");
    const Valor = Number(localStorage.getItem("ValorDaRespostaAtual"));

    if (!jogadorRefKey) return;

    const jogadorRef = ref(db, `Jogadores/${jogadorRefKey}/`);
    const jogadorRefPerguntas = ref(db, `Jogadores/${jogadorRefKey}/perguntas/`);

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
        }
        else {
            const dados = snapshot.val();
            if (dados.perguntas[RespostaIDLocal] == -1) {
                if (RespostaDoJogador != -1 && !FimDeTempo) {
                    update(jogadorRefPerguntas, {
                        [RespostaIDLocal]: RespostaDoJogador
                    })
                }
            }
            if (!FimDeTempo) {
                if (pontosGravados <= 0) {
                    pontosGravados = RespostaDoJogador == localStorage.getItem("RespostaCorreta") ? ((Math.max(Tempo, 0) * 123) * Valor) : 0;
                }
            }
            else if (pontosGravados > 0) {
                console.log(`O jogador Alcançou a pontuação de ${pontosGravados} este jogo.`)
                pontosGravados += dados.pontos;
                update(jogadorRef, {
                    pontos: pontosGravados
                })
                console.log(`A pontuação atual do jogador ${dados.nome} é ${dados.pontos}`)
                pontosGravados = -1;
            }
        }
    });
    if (RespostasID == -1) return;
    get(respostaRef).then((snapshot) => {
        if (snapshot.exists()) {
            const dados = snapshot.val();
            tempoDaPergunta = dados[RespostasID].Time;
            localStorage.setItem("RespostaCorreta", dados[RespostasID].Resposta)
            localStorage.setItem("ValorDaRespostaAtual", dados[RespostasID].Valor)
        }
    });
    if (tempoRef > 1 && tempoDaPergunta > 0) {
        Tempo -= tempoRef - Date.now() + tempoDaPergunta * 1000;
        Tempo /= 1000;
        Tempo = Math.max(0, -Math.ceil(Tempo)); 
    }
    else return;
    if (Tempo >= 0) {
        FimDeTempo = false;
        const minutos = Math.floor(Tempo / 60);
        const segundos = Tempo % 60;
        const textoTime = (minutos > 9 ? minutos : "0" + minutos) + ":" + (segundos > 9 ? segundos : "0" + segundos);
        document.getElementById("Time").innerText = textoTime;
    }
    else if (!FimDeTempo) {
        document.querySelector('.Main').innerHTML = `<iframe class="IPergunta" src="./Perguntas/${RespostasID}.html?type=PlayerEnd"></iframe>`;
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
        // Sai do jogo e remove do DB
        SairDoJogo();
        document.querySelector(".ForaDoAr").style.display = 'block';
        document.querySelector(".Every").style.display = 'none';
        document.querySelector(".Time").style.display = 'none';
        return;
    }

    tempoRef = dados.Time;
    // Caso esteja logado:
    document.querySelector(".ForaDoAr").style.display = 'none';
    document.querySelector(".Every").style.display = 'block';
    document.querySelector('.Main').style.display = 'block';

    document.querySelector('.Main').innerHTML = `<div class="EsperandoDiv"><h1>Esperando a Partida Começar</h1></div>`;
    if (!JogadorOnline) {
        if (dados.PerguntasStart) {
            document.getElementById('EntrarArea').style.display = 'none';
            document.querySelector('.JogoStartdontgo').innerHTML = `<h1>Jogo já iniciado!</h1><br><h2>Espere o host iniciar novamente!</h2>`;
        }
        return;
    }
    if (dados.PerguntasStart) {
        document.getElementById("TituloInicial").style.display = "none";
        document.querySelector('.Main').innerHTML = `<iframe class="IPergunta" src="./Perguntas/${dados.PerguntasID}.html?type=Player"></iframe>`;
        document.querySelector(".Time").style.display = 'block';
        RespostasID = dados.PerguntasID;
        localStorage.setItem("RespostaID", dados.PerguntasID);

    } else {
        document.querySelector(".Time").style.display = 'none';
    }
}

function Reiniciar() {
    get(jogoRef).then((snapshot) => {
        if (snapshot.exists()) {
            const dados = snapshot.val();
            atualizarJogo(dados);
        }
    }).catch((erro) => console.error("Erro ao reiniciar:", erro));
}

// Funções Externas //

window.addEventListener('load', () => {
    const nome = localStorage.getItem('nomeJogador');
    const jogadorRefKey = localStorage.getItem('jogadorRefKey');

    if (nome && jogadorRefKey) {
        const jogadorRef = ref(db, `Jogadores/${jogadorRefKey}`);

        set(jogadorRef, {
            nome: nome,
            perguntas: {
                "0": -1,
            },
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

    // salva a referência no localStorage
    localStorage.setItem('jogadorRefKey', novoJogadorRef.key);

    // Cria os dados do jogador
    set(novoJogadorRef, {
        nome: name,
        perguntas: {
            "0": -1,
        },
        pontos: 0
    })
        .then(() => {
            console.log("Jogador entrou no jogo");
            JogadorOnline = true;
        })
        .catch(err => console.error(err));

    Reiniciar();
    // Remove o jogador quando desconectar
    onDisconnect(novoJogadorRef).remove();
}

// Remove jogador manualmente (por exemplo, quando o host não iniciou)
window.SairDoJogo = function () {
    const jogadorRefKey = localStorage.getItem('jogadorRefKey');
    if (!jogadorRefKey) return;

    const jogadorRef = ref(db, `Jogadores/${jogadorRefKey}`);
    remove(jogadorRef)
        .catch(err => console.error(err));

    JogadorOnline = false;
    console.log("Jogador desconectado");
    localStorage.removeItem('jogadorRefKey');
    localStorage.removeItem('nomeJogador');
    document.querySelector(".Main").innerHTML = "";
    location.reload();
}