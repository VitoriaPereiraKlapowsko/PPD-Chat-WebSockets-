const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});

app.use(express.static(path.join(__dirname, 'public')));

let connectedUsers = {};

io.on('connection', (socket) => {
    console.log('Conexão detectada...');

    socket.on('join-request', (username) => {
        socket.username = username;
        if (!connectedUsers[username]) {
            connectedUsers[username] = socket.id;
        }

        socket.emit('user-ok', Object.keys(connectedUsers));
        socket.broadcast.emit('list-update', {
            joined: username,
            list: Object.keys(connectedUsers),
        });
    });

    socket.on('join-room', (room) => {
        if (socket.room) {
            socket.leave(socket.room); // Sair da sala atual
        }

        socket.room = room;
        socket.join(room);

        socket.emit('joined-room', room);
        console.log(`${socket.username} entrou na sala ${room}`);
    });

    socket.on('send-msg', (data) => {
        let obj = {
            username: socket.username,
            message: data.message,
        };

        io.to(data.room).emit('show-msg', obj); // Envia mensagem apenas para a sala
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.username];

        socket.broadcast.emit('list-update', {
            left: socket.username,
            list: Object.keys(connectedUsers),
        });

        console.log(`${socket.username} desconectou-se.`);
    });

    socket.on('leave-room', (room) => {
        if (room) {
            socket.leave(room);
            console.log(`${socket.username} saiu da sala ${room}`);
        }
    });
    
});
