import { io, Socket } from 'socket.io-client';

export class ServerABI {
    private static socket: Socket;
    static ipAddress = '127.0.0.1';
    static ipPort = '8000';
    static isWork: boolean = false;

    static connect() {
        if (!ServerABI.socket) {
            ServerABI.socket = io(`http://${this.ipAddress}:${this.ipPort}`, {
                transports: ['websocket'],
                reconnectionAttempts: 5,
                timeout: 5000
            });

            ServerABI.socket.on('connect', () => {
                console.log('✅ Подключено к WebSocket:', ServerABI.socket.id);
                ServerABI.isWork = true;
            });

            ServerABI.socket.on('connect_error', (err) => {
                console.error('❌ Ошибка подключения к WebSocket:', err.message);
            });

            ServerABI.socket.on('disconnect', (reason) => {
                console.warn('⚠️ WebSocket отключён:', reason);
            });

            ServerABI.socket.io.on('reconnect_attempt', (attempt) => {
                console.log(`🔁 Попытка переподключения (${attempt})...`);
            });

            ServerABI.socket.io.on('reconnect_failed', () => {
                console.error('❌ Все попытки переподключения не удались.');
            });
            if (ServerABI.isWork) { console.log('WORK') }
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
    }
}
