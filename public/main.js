const socket = io();

let username = '';
let roomName = ''; // Variável para armazenar o nome da sala

let loginPage = document.querySelector('#loginPage');
let chatPage = document.querySelector('#chatPage');
let loginInput = document.querySelector('#loginNameInput');
let roomInput = document.querySelector('#roomNameInput');
let textInput = document.querySelector('#chatTextInput');

loginPage.style.display = 'flex';
chatPage.style.display = 'none';

function renderUserList() {
    let ul = document.querySelector('.userList');
    ul.innerHTML = '';

    userList.forEach((i) => {
        ul.innerHTML += '<li>' + i + '</li>';
    });
}

function addMessage(type, user, msg) {
    let ul = document.querySelector('.chatList');

    switch (type) {
        case 'status':
            ul.innerHTML += '<li class="m-status">' + msg + '</li>';
            break;
        case 'msg':
            if (username === user) {
                ul.innerHTML += '<li class="m-txt"><span class="me">' + user + '</span> ' + msg + '</li>';
            } else {
                ul.innerHTML += '<li class="m-txt"><span>' + user + '</span> ' + msg + '</li>';
            }
            break;
    }
    ul.scrollTop = ul.scrollHeight;
}

// Entrar no chat
loginInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        let name = loginInput.value.trim();
        if (name !== '') {
            username = name;
            document.title = 'Chat (' + username + ')';

            loginPage.style.display = 'none';
            chatPage.style.display = 'flex';

            socket.emit('join-request', username);
        }
    }
});

// Entrar na sala
document.getElementById('roomSelectBtn').addEventListener('click', () => {
    const selectedRoom = roomInput.value.trim();
    if (selectedRoom) {
        roomName = selectedRoom;
        socket.emit('join-room', roomName);
    }
});

// Enviar mensagem
textInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        let txt = textInput.value.trim();
        textInput.value = '';

        if (txt !== '') {
            addMessage('msg', username, txt);
            socket.emit('send-msg', { room: roomName, message: txt });
        }
    }
});

// Resposta do servidor ao entrar no chat
socket.on('user-ok', (list) => {
    addMessage('status', null, 'Conectado!');
    userList = list;
    renderUserList();
});

// Resposta do servidor ao entrar na sala
socket.on('joined-room', (room) => {
    document.getElementById('roomDisplay').innerText = `Sala: ${room}`;
    addMessage('status', null, `Você entrou na sala ${room}`);
});

// Atualizar lista de usuários
socket.on('list-update', (data) => {
    if (data.joined) {
        addMessage('status', null, data.joined + ' entrou no chat!');
    }
    if (data.left) {
        addMessage('status', null, data.left + ' saiu do chat!');
    }

    userList = data.list;
    renderUserList();
});

// Mostrar mensagem recebida
socket.on('show-msg', (data) => {
    addMessage('msg', data.username, data.message);
});

// Tratamento de desconexão e reconexão
socket.on('disconnect', () => {
    addMessage('status', null, 'Você foi desconectado...');
    userList = [];
    renderUserList();
});

socket.on('reconnect', () => {
    addMessage('status', null, 'Reconectado!');
    if (username !== '') {
        socket.emit('join-request', username);
    }
});

// Botão para sair da sala e retornar ao login
document.getElementById('exitRoomBtn').addEventListener('click', () => {
    if (roomName) {
        socket.emit('leave-room', roomName);
        roomName = '';

        addMessage('status', null, 'Você saiu do chat.');
        loginPage.style.display = 'flex';
        chatPage.style.display = 'none';

        document.getElementById('roomDisplay').innerText = 'Sala:';
    }
});

