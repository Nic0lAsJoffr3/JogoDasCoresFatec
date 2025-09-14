


// Testa se o dígito é uma letra
function TestarDigito() {
    const nomeJogador = document.getElementById('nomeJogador');
    nomeJogador.value = nomeJogador.value.replace(/[^a-zA-Z ]/g, '');

    if (nomeJogador.value.length > 20) {
        nomeJogador.value = nomeJogador.value.slice(0, 20); // pega só os 20 primeiros caracteres
    }
}

// Função de logar usuário
function entrar() {
    const ErroLog = document.querySelector('.erroLog');
    const nomeJogador = document.getElementById('nomeJogador');

    const regex = /^[A-Za-z ]{4,}$/;
    if (!regex.test(nomeJogador.value)) {
        if (nomeJogador.value.length < 4)
            ErroLog.innerHTML = "O nome deve ter no mínimo 4 letras.";
        else
            ErroLog.innerHTML = 'Por favor, insira um nome válido.';
        nomeJogador.focus();
        setTimeout(() => ErroLog.innerHTML = '', 3000);
        return;
    } else {
        ErroLog.innerHTML = '';
    }

    // Salva nome localmente
    localStorage.setItem('nomeJogador', nomeJogador.value);

    // Chama a função para entrar no jogo
    EntrarNoJogo(nomeJogador.value);
}

// Função para mudar o nome / sair do jogo
function NewName() {
    const jogadorRefKey = localStorage.getItem('jogadorRefKey');
    const nomeJogador = document.getElementById('nomeJogador');

    // Preenche o input com o nome salvo
    nomeJogador.value = localStorage.getItem('nomeJogador') || '';
    nomeJogador.focus();

    // Limpa dados locais e remove do banco
    localStorage.removeItem('nomeJogador');
    if (jogadorRefKey) {
        SairDoJogo(); // vai usar a referência salva
    }
}

// Loop para atualizar interface
setInterval(() => {
    const nomeJogador = localStorage.getItem('nomeJogador');
    if (!nomeJogador) {
        document.getElementById('off').style.display = 'none';
        document.querySelector('.Entrar').style.display = 'block';
        document.querySelector('.Main').style.display = 'none';
        return;
    }
    document.getElementById('off').style.display = 'block';
    document.querySelector('.Entrar').style.display = 'none';
    document.querySelector('.Main').style.display = 'block';
}, 100);
