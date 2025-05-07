import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// 👇 Добавляем CORS middleware в Express
app.use(cors({
    origin: '*',
    credentials: true,
}));

// 👇 Socket.IO с явной CORS-настройкой
const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('text', (data) => {
        console.log('Получен текст от клиента');
        socket.broadcast.emit('text', data);
    });

    socket.on('canvasImage', (data) => {
        console.log('Получено изображение от клиента');
        socket.broadcast.emit('canvasImage', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});


server.listen(8000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:8000');
});
