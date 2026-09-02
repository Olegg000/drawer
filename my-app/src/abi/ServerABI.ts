import { io, Socket } from 'socket.io-client';

export interface RoomState {
    text: string;
    lines: { id: string; points: number[]; color?: string; width?: number }[];
    userCount: number;
}

export class ServerABI {
    private static socket: Socket;
    // Адрес сервера комнат: из переменной сборки, иначе тот же хост на порту 8000
    static get serverUrl(): string {
        const configured = process.env.REACT_APP_SERVER_URL;
        if (configured) return configured;
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
        return `http://${hostname}:8000`;
    }

    /**
     * Со страницы по https браузер не пустит соединение к http/ws — это Mixed Content.
     * Поэтому на статичном хостинге (GitHub Pages) сервера комнат нет: не пытаемся
     * подключаться вовсе, иначе консоль забивается заблокированными запросами.
     */
    static get available(): boolean {
        if (typeof window === 'undefined') return false;
        if (window.location.protocol !== 'https:') return true;
        return ServerABI.serverUrl.startsWith('https://');
    }

    static isWork: boolean = false;
    static currentRoomId: string | null = null;

    static connect() {
        if (!ServerABI.available) return;
        if (!ServerABI.socket) {
            ServerABI.socket = io(ServerABI.serverUrl, {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
                timeout: 5000
            });

            ServerABI.socket.on('connect', () => {
                ServerABI.isWork = true;
            });

            ServerABI.socket.on('connect_error', (err) => {
                console.error('❌ Ошибка подключения к WebSocket:', err.message);
                ServerABI.isWork = false;
            });

            ServerABI.socket.on('disconnect', (reason) => {
                console.warn('⚠️ WebSocket отключён:', reason);
                ServerABI.isWork = false;
            });

            ServerABI.socket.io.on('reconnect', () => {
                ServerABI.isWork = true;
                // Переподключаемся к комнате если была
                if (ServerABI.currentRoomId) {
                    ServerABI.joinRoom(ServerABI.currentRoomId);
                }
            });

            ServerABI.socket.io.on('reconnect_failed', () => {
                console.error('❌ Все попытки переподключения не удались.');
                ServerABI.isWork = false;
            });
        }
    }

    static joinRoom(roomId: string) {
        ServerABI.currentRoomId = roomId;
        if (ServerABI.socket?.connected) {
            ServerABI.socket.emit('joinRoom', roomId);
        }
    }

    static leaveRoom() {
        ServerABI.currentRoomId = null;
    }

    static sendText(text: string) {
        if (ServerABI.socket?.connected && ServerABI.currentRoomId) {
            ServerABI.socket.emit('text', { roomId: ServerABI.currentRoomId, text });
        }
    }

    static sendDrawLine(line: { id: string; points: number[]; color?: string; width?: number }) {
        if (ServerABI.socket?.connected && ServerABI.currentRoomId) {
            ServerABI.socket.emit('drawLine', { roomId: ServerABI.currentRoomId, line });
        }
    }

    // Обновление адресуем по идентификатору штриха: когда рисуют несколько человек,
    // «последняя линия» у каждого своя, и без id участники затирают чужие штрихи.
    static sendUpdateLine(id: string, points: number[]) {
        if (ServerABI.socket?.connected && ServerABI.currentRoomId) {
            ServerABI.socket.emit('updateLine', { roomId: ServerABI.currentRoomId, id, points });
        }
    }

    static sendRemoveLine(id: string) {
        if (ServerABI.socket?.connected && ServerABI.currentRoomId) {
            ServerABI.socket.emit('removeLine', { roomId: ServerABI.currentRoomId, id });
        }
    }

    static sendClearLines() {
        if (ServerABI.socket?.connected && ServerABI.currentRoomId) {
            ServerABI.socket.emit('clearLines', ServerABI.currentRoomId);
        }
    }

    static emit(event: string, data: any) {
        if (ServerABI.socket?.connected) {
            ServerABI.socket.emit(event, data);
        } else {
            console.warn('⛔ Попытка отправки, но сокет не подключён');
        }
    }

    static on(event: string, callback: (...args: any[]) => void) {
        ServerABI.socket?.on(event, callback);
    }

    static off(event: string, callback?: (...args: any[]) => void) {
        if (callback) {
            ServerABI.socket?.off(event, callback);
        } else {
            ServerABI.socket?.removeAllListeners(event);
        }
    }

    static disconnect() {
        ServerABI.socket?.disconnect();
        ServerABI.socket = undefined as any;
        ServerABI.isWork = false;
        ServerABI.currentRoomId = null;
    }
}
