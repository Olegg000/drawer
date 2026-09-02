import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// CORS middleware для Express
app.use(cors({
    origin: '*',
    credentials: true,
}));

// Socket.IO с CORS-настройкой
const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

/** Штрих доски: идентификатор нужен, чтобы участники не затирали линии друг друга. */
interface Stroke {
    id: string;
    points: number[];
    color?: string;
    width?: number;
}

// Хранилище состояния комнат
interface RoomState {
    text: string;
    lines: Stroke[];
    users: Set<string>;
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            text: '',
            lines: [],
            users: new Set()
        });
    }
    return rooms.get(roomId)!;
}

io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    let currentRoom: string | null = null;

    // Присоединение к комнате
    socket.on('joinRoom', (roomId: string) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            const room = rooms.get(currentRoom);
            if (room) {
                room.users.delete(socket.id);
                io.to(currentRoom).emit('userCount', room.users.size);
            }
        }

        currentRoom = roomId;
        socket.join(roomId);

        const room = getOrCreateRoom(roomId);
        room.users.add(socket.id);

        // Отправляем текущее состояние новому участнику
        socket.emit('roomState', {
            text: room.text,
            lines: room.lines,
            userCount: room.users.size
        });

        // Уведомляем остальных о количестве участников
        io.to(roomId).emit('userCount', room.users.size);
        console.log(`👤 User ${socket.id} joined room ${roomId} (${room.users.size} users)`);
    });

    // Получение текста от клиента
    socket.on('text', (data: { roomId: string; text: string }) => {
        const room = rooms.get(data.roomId);
        if (room) {
            room.text = data.text;
            socket.to(data.roomId).emit('text', data.text);
        }
    });

    // Получение новой линии при рисовании
    socket.on('drawLine', (data: { roomId: string; line: Stroke }) => {
        const room = rooms.get(data.roomId);
        if (room) {
            room.lines.push(data.line);
            socket.to(data.roomId).emit('drawLine', data.line);
        }
    });

    // Обновление ведущегося штриха: адресуем по id, иначе при одновременном
    // рисовании точки уходят в чужую линию
    socket.on('updateLine', (data: { roomId: string; id: string; points: number[] }) => {
        const room = rooms.get(data.roomId);
        if (!room) return;
        const stroke = room.lines.find(l => l.id === data.id);
        if (stroke) stroke.points = data.points;
        socket.to(data.roomId).emit('updateLine', { id: data.id, points: data.points });
    });

    // Удаление одного штриха — ластик
    socket.on('removeLine', (data: { roomId: string; id: string }) => {
        const room = rooms.get(data.roomId);
        if (!room) return;
        room.lines = room.lines.filter(l => l.id !== data.id);
        socket.to(data.roomId).emit('removeLine', data.id);
    });

    // Очистка рисунков
    socket.on('clearLines', (roomId: string) => {
        const room = rooms.get(roomId);
        if (room) {
            room.lines = [];
            socket.to(roomId).emit('clearLines');
        }
    });

    socket.on('disconnect', () => {
        console.log('⚠️ Client disconnected:', socket.id);
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.users.delete(socket.id);
                io.to(currentRoom).emit('userCount', room.users.size);
                console.log(`👤 User left room ${currentRoom} (${room.users.size} users remaining)`);

                // Удаляем пустые комнаты через минуту
                if (room.users.size === 0) {
                    setTimeout(() => {
                        const r = rooms.get(currentRoom!);
                        if (r && r.users.size === 0) {
                            rooms.delete(currentRoom!);
                            console.log(`🗑️ Room ${currentRoom} deleted (empty)`);
                        }
                    }, 60000);
                }
            }
        }
    });
});

const PORT = 8000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
