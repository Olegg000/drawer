# Drawer — realtime collaborative whiteboard

> **EN (short):** A realtime collaborative whiteboard: several people draw and type on a shared canvas at once, changes sync instantly over WebSocket. Frontend — React 19 + react-konva + Redux Toolkit (CRA, PWA). Backend — Express + Socket.IO with in-memory room state. Rooms are addressed by URL (`/Draw/:roomId`); a solo `local` mode persists to `localStorage`. Run: start the Socket.IO server (`server/`, port 8000), then the client (`my-app/`, port 3000).

**Demo:** `демо: docs/demo.gif` <!-- GIF будет добавлен позже -->

---

## Что это

Drawer — доска для совместного рисования и заметок в реальном времени. Несколько
человек заходят в одну комнату и одновременно рисуют на общем холсте и печатают
общий текст — всё синхронизируется мгновенно через WebSocket (Socket.IO).

### Возможности

- **Совместное рисование** — линии на холсте `react-konva` транслируются всем
  участникам комнаты в реальном времени.
- **Общий текст** — текстовое поле синхронизируется между всеми участниками.
- **Комнаты** — адрес комнаты в URL (`/Draw/:roomId`); при входе новый участник
  получает текущее состояние доски.
- **Счётчик онлайна** — сервер отдаёт число активных участников комнаты.
- **Локальный режим** — `/Draw/local` работает без сервера, состояние хранится в
  `localStorage`.
- **Undo / Redo** — отмена и возврат штрихов с клавиатуры (Ctrl/⌘ + Z / Y).
- **Тёмная и светлая темы**, PWA (service worker, устанавливается как приложение).

## Стек

| Слой     | Технологии                                                                 |
|----------|----------------------------------------------------------------------------|
| Клиент   | React 19, TypeScript, react-konva / konva, Redux Toolkit, react-router, framer-motion, styled-components, CRA (PWA-шаблон) |
| Сервер   | Node.js, Express, Socket.IO, TypeScript (ts-node)                          |
| Транспорт| WebSocket (Socket.IO), fallback на long-polling                            |

## Как запустить

Нужен Node.js (проверено на Node 24). Клиент и сервер запускаются отдельно.

### 1. Сервер (Socket.IO, порт 8000)

```bash
cd server
npm install
npm start
```

Сервер поднимается на `http://0.0.0.0:8000` и хранит состояние комнат в памяти.

### 2. Клиент (CRA, порт 3000)

```bash
cd my-app
npm install
npm start
```

Клиент сам определяет адрес сервера как `http://<hostname>:8000`, поэтому при
локальном запуске дополнительная настройка не нужна. Открыть в браузере
`http://localhost:3000`, создать комнату и открыть тот же URL комнаты во второй
вкладке/на другом устройстве, чтобы увидеть синхронизацию.

Production-сборка клиента:

```bash
cd my-app
npm run build
```

## Структура

```
drawer/
├── my-app/               # React-клиент (CRA + PWA)
│   ├── public/           # статика, иконки, manifest
│   └── src/
│       ├── Pages/        # StartPage (лендинг), DrawPage (холст + текст)
│       ├── Components/   # карточки комнат, создание комнаты
│       ├── abi/          # ServerABI — обёртка над Socket.IO-клиентом
│       ├── Store/        # Redux Toolkit store
│       ├── sourses/      # SVG-иконки (Sun / Moon / Pen)
│       └── utils/        # delay, случайные фразы-плейсхолдеры
└── server/               # Express + Socket.IO
    └── server.ts         # комнаты, трансляция линий и текста, счётчик онлайна
```

## Как это работает

- Клиент подключается к серверу через `ServerABI` (обёртка над `socket.io-client`
  с авто-переподключением).
- При входе в комнату (`joinRoom`) сервер отдаёт текущее состояние (`roomState`) и
  рассылает новичка остальным.
- Рисование шлёт события `drawLine` / `updateLine`, текст — `text`, очистка —
  `clearLines`. Сервер хранит состояние каждой комнаты в `Map` и ретранслирует
  события остальным участникам.
- Пустые комнаты сервер удаляет через минуту после ухода последнего участника.

---

### Автор

**Ковалик Олег Владиславович**

- Чемпионат «Профессионалы» 2025 — 1 место (Самара) по мобильной разработке
  (3 место в России, 1 место в командном зачёте); 2 место (Самара) по блокчейну
- Волга-IT'2025 — 3 место (Flutter / ОС Аврора)
- MTS True Tech Champ — 3 место
- Финалист РуКод (МФТИ)
- 1С:Профессионал 8.3
- Фриланс-контракты Solidity / FunC / Tact (под NDA)
