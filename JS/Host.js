/* FireBase: */
    // Importa funções do Firebase
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getDatabase, ref, push, set, onValue, get, remove, update, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
    // Configuração do seu projeto
    const firebaseConfig = {
        apiKey: "AIzaSyCWWVFgQu2RBg6Y3TylBqz7UtMRl1V7Tgc",
        authDomain: "jogoteoriadascoresfatec.firebaseapp.com",
        databaseURL: "https://jogoteoriadascoresfatec-default-rtdb.firebaseio.com",
        projectId: "jogoteoriadascoresfatec",
        storageBucket: "jogoteoriadascoresfatec.firebasestorage.app",
        messagingSenderId: "1029972349838",
        appId: "1:1029972349838:web:5ab64e63a30bf5e1594adf",
        measurementId: "G-6GDTJRFBVV"
    };
    // Inicializa Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    let respostaID = -1
    window.IniciarHost = function () {
        const jogoRef = ref(db, "Host"); // referência para o status do jogo
        set(jogoRef, { iniciado: true, PerguntasStart: false, PerguntasID: 0, Time: 0 }); // grava que o jogo foi iniciado
    }
    window.EncerarHost = function () {
        const jogoRef = ref(db, "Host"); // referência para o status do jogo
        set(jogoRef, { iniciado: false, PerguntasStart: false, PerguntasID: 0, Time: 0 }); // grava que o jogo foi iniciado
    }
    window.IniciarPergunta = function () {

        const jogoRef = ref(db, "Host"); // referência para o status do jogo
        let agora =  Date.now();
        
        console.log(agora)
        set(jogoRef, { iniciado: true, PerguntasStart: true, PerguntasID: 0, Time: agora }); // grava que o jogo foi iniciado
    }
    window.PassarPergunta = function () {
        const jogoRef = ref(db, "Host"); // referência para o status do jogo
        let PerguntaIDLet;
        onValue(jogoRef, (snapshot) => {
            const dados = snapshot.val();
            PerguntaIDLet = dados.PerguntasID + 1;

        });
        let agora =  Date.now();
        set(jogoRef, { iniciado: true, PerguntasStart: true, PerguntasID: PerguntaIDLet, Time: agora}); // grava que o jogo foi iniciado
    }
    window.VoltarPergunta = function () {
        const jogoRef = ref(db, "Host"); // referência para o status do jogo
        let PerguntaIDLet;
        onValue(jogoRef, (snapshot) => {
            const dados = snapshot.val();
            PerguntaIDLet = dados.PerguntasID - 1;

        });
        let agora =  Date.now();
        set(jogoRef, { iniciado: true, PerguntasStart: true, PerguntasID: PerguntaIDLet, Time: agora }); // grava que o jogo foi iniciado
    }


    // Escuta alterações no status do jogo
    let jogoRef = ref(db, "Host");
    onValue(jogoRef, (snapshot) => {

        const dados = snapshot.val();
        respostaID = dados.PerguntasID;

        if (!(dados && dados.iniciado)) {
            document.getElementById("HostStart").style.display = 'block';
            document.getElementById("HostEnd").style.display = 'none';
            document.getElementById("goQuestion").style.display = 'none';
            document.getElementById("goQuestionTo").style.display = 'none';
            document.getElementById("notgoQuestionTo").style.display = 'none';
            document.getElementById("MsgConfirmação").innerText = "O Host está inativo.";
            return;
        }
        document.getElementById("HostStart").style.display = 'none';
        document.getElementById("HostEnd").style.display = 'block';
        document.getElementById("MsgConfirmação").innerText = "O Host está ativo!";
        if (!dados.PerguntasStart) {
            document.getElementById("goQuestion").style.display = 'block';
            document.getElementById("goQuestionTo").style.display = 'none';
            document.getElementById("notgoQuestionTo").style.display = 'none';
            return;
        }
        document.getElementById("goQuestion").style.display = 'none';
        document.getElementById("goQuestionTo").style.display = 'block';

        //ativa o botão de voltar
        if (dados.PerguntasID > 0)
            document.getElementById("notgoQuestionTo").style.display = 'block';
        else
            document.getElementById("notgoQuestionTo").style.display = 'none';

        //modifica os textos dos botões
        document.getElementById("notgoQuestionTo").value = `Voltar para a ${dados.PerguntasID}º Pergunta`;
        document.getElementById("goQuestionTo").value = `Iniciar a ${dados.PerguntasID + 2}º Pergunta`;
    });