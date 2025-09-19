// importa conexão com banco de dados //
import { db, ref, push, set, onValue, get, remove, update, onDisconnect } from "./System.js";

//-----Var-----//

// let //
let JogadorOnline = false;
let tempoRef;
let RespostasID = -1;
let jogoRef = ref(db, "Host");
let respostaRef = ref(db, "Respostas");
let pontosGravados = 0; // pontos calculados para a pergunta atual
let respondeuEPontuou = false; // flag para não pontuar infinitamente
let FimDeTempo = false;
let Tempo = 0;
let tempoDaPergunta = 0;
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

setInterval(() => {
    // Inicializa localStorage se não existir
    if (localStorage.getItem("RespostaID") == null) localStorage.setItem("RespostaID", -1);
    if (localStorage.getItem("RespostaDoJogador") == null) localStorage.setItem("RespostaDoJogador", -1);

    const jogadorRefKey = localStorage.getItem('jogadorRefKey');
    const RespostaIDLocal = Number(localStorage.getItem("RespostaID") || -1);
    const RespostaDoJogadorRaw = localStorage.getItem("RespostaDoJogador")?.toString() || "-1";
    const Valor = Number(localStorage.getItem("ValorDaRespostaAtual")) || 1;

    if (!jogadorRefKey || RespostaIDLocal === -1) return;

    const jogadorRef = ref(db, `Jogadores/${jogadorRefKey}/`);
    const jogadorRefPerguntas = ref(db, `Jogadores/${jogadorRefKey}/perguntas/`);

    // Atualiza dados do jogador
    get(jogadorRef).then(snapshot => {
        if (!snapshot.exists()) return;

        const dados = snapshot.val();

        // Salva a resposta do jogador se ainda não registrada
        if (RespostaDoJogadorRaw !== "-1" && dados.perguntas[RespostaIDLocal] == -1) {
            update(jogadorRefPerguntas, { [RespostaIDLocal]: RespostaDoJogadorRaw })
                .then(() => console.log(`Resposta ${RespostaDoJogadorRaw} gravada para pergunta ${RespostaIDLocal}`))
                .catch(err => console.error("Erro ao gravar resposta:", err));
        }

        // Se ainda não respondeu, não continua
        if (RespostaDoJogadorRaw === "-1") return;

        // --- Normaliza respostas ---
        const respostaCorretaRaw = localStorage.getItem("RespostaCorreta") || "-1";
        const respostaCorretaArray = respostaCorretaRaw.toString().split("").map(n => parseInt(n, 10));
        const respostaJogadorArray = RespostaDoJogadorRaw.split("").map(n => parseInt(n, 10));

        // --- Verifica acerto ---
        const acertou = respostaJogadorArray.some(r => respostaCorretaArray.includes(r));

        // --- Calcula pontos apenas uma vez ---
        if (!respondeuEPontuou && acertou) {
            pontosGravados = Math.max(Tempo, 0) * 123 * Valor;
            const novaPontuacao = (dados.pontos || 0) + pontosGravados;

            update(jogadorRef, { pontos: novaPontuacao })
                .then(() => {
                    console.log(`O jogador ${dados.nome} alcançou ${pontosGravados} pontos. Total: ${novaPontuacao}`);
                    respondeuEPontuou = true; // impede múltiplas gravações
                })
                .catch(err => console.error("Erro ao gravar pontos:", err));
        }
    });

    // Atualiza dados da pergunta
    get(respostaRef).then(snapshot => {
        if (snapshot.exists() && RespostaIDLocal !== -1) {
            const dadosPergunta = snapshot.val();
            tempoDaPergunta = dadosPergunta[RespostaIDLocal].Time;
            localStorage.setItem("RespostaCorreta", dadosPergunta[RespostaIDLocal].Resposta);
            localStorage.setItem("ValorDaRespostaAtual", dadosPergunta[RespostaIDLocal].Valor);
        }
    });

    // Calcula tempo restante
    if (tempoRef > 0 && tempoDaPergunta > 0) {
        const tempoPassado = Date.now() - tempoRef;
        Tempo = Math.max(0, tempoDaPergunta - Math.floor(tempoPassado / 1000));
    }

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
                `<iframe class="IPergunta" src="./Perguntas/${RespostaIDLocal}.html?type=PlayerEnd"></iframe>`;
        }
        FimDeTempo = true;
        respondeuEPontuou = false; // reseta para a próxima pergunta
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
