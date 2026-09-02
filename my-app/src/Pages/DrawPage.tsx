import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { Stage, Layer, Line } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { getRandomPhrase } from "../utils/getRandomPhrase";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Eraser, Moon, PenLine, Sun, Trash2, Undo2, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ServerABI, RoomState } from "../abi/ServerABI";

interface DrawPageProps {
    setIsDark: Dispatch<SetStateAction<boolean>>;
}

/** Штрих: у каждого свой идентификатор, цвет и толщина — иначе участники затирают линии друг друга. */
export interface Stroke {
    id: string;
    points: number[];
    color?: string;
    width?: number;
}

const WIDTHS = [2, 4, 8];
const ERASER_RADIUS = 14;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const DrawPage: React.FC<DrawPageProps> = ({ setIsDark }) => {
    const { roomId } = useParams<{ roomId: string }>();
    const [text, setText] = useState<string>('');
    const [lines, setLines] = useState<Stroke[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingMode, setDrawingMode] = useState(true);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [isDarkState, setIsDarkState] = useState(localStorage.getItem('theme') !== 'light');
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [undoStack, setUndoStack] = useState<Stroke[]>([]);
    const [phrase] = useState<string>(() => getRandomPhrase());
    const [userCount, setUserCount] = useState(1);
    const [isNetworkMode, setIsNetworkMode] = useState(false);
    const [isServerDown, setIsServerDown] = useState(false);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    const textRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const theme = useTheme();
    const isRemoteUpdate = useRef(false);

    const [color, setColor] = useState<string>(theme.inks[0]);
    const [width, setWidth] = useState<number>(WIDTHS[1]);

    // Палитра зависит от режима: ночные цвета на светлой бумаге не читаются
    useEffect(() => {
        setColor(prev => (theme.inks.includes(prev) ? prev : theme.inks[0]));
    }, [theme]);

    // Подключение к комнате при монтировании
    useEffect(() => {
        if (roomId && roomId !== 'local') {
            setIsNetworkMode(true);
            ServerABI.connect();

            const joinTimeout = setTimeout(() => {
                ServerABI.joinRoom(roomId);
            }, 500);

            const handleRoomState = (state: RoomState) => {
                isRemoteUpdate.current = true;
                setText(state.text);
                setLines(state.lines as Stroke[]);
                setUserCount(state.userCount);
                isRemoteUpdate.current = false;
            };

            const handleText = (newText: string) => {
                isRemoteUpdate.current = true;
                setText(newText);
                isRemoteUpdate.current = false;
            };

            const handleDrawLine = (line: Stroke) => {
                setLines(prev => [...prev, line]);
            };

            // Обновляем именно тот штрих, который ведёт автор, а не последний в списке
            const handleUpdateLine = (payload: { id: string; points: number[] }) => {
                setLines(prev => prev.map(l => (l.id === payload.id ? { ...l, points: payload.points } : l)));
            };

            const handleRemoveLine = (id: string) => {
                setLines(prev => prev.filter(l => l.id !== id));
            };

            const handleClearLines = () => setLines([]);
            const handleUserCount = (count: number) => setUserCount(count);

            // Сервер может быть не поднят (например, на статическом хостинге):
            // ловим это событиями сокета и одной проверкой по таймауту.
            const handleConnected = () => setIsServerDown(false);
            const handleConnectError = () => setIsServerDown(true);
            const downCheck = setTimeout(() => setIsServerDown(!ServerABI.isWork), 3000);

            ServerABI.on('connect', handleConnected);
            ServerABI.on('connect_error', handleConnectError);
            ServerABI.on('roomState', handleRoomState);
            ServerABI.on('text', handleText);
            ServerABI.on('drawLine', handleDrawLine);
            ServerABI.on('updateLine', handleUpdateLine);
            ServerABI.on('removeLine', handleRemoveLine);
            ServerABI.on('clearLines', handleClearLines);
            ServerABI.on('userCount', handleUserCount);

            return () => {
                clearTimeout(joinTimeout);
                clearTimeout(downCheck);
                ServerABI.off('connect', handleConnected);
                ServerABI.off('connect_error', handleConnectError);
                ServerABI.off('roomState', handleRoomState);
                ServerABI.off('text', handleText);
                ServerABI.off('drawLine', handleDrawLine);
                ServerABI.off('updateLine', handleUpdateLine);
                ServerABI.off('removeLine', handleRemoveLine);
                ServerABI.off('clearLines', handleClearLines);
                ServerABI.off('userCount', handleUserCount);
                ServerABI.leaveRoom();
            };
        } else {
            setIsNetworkMode(false);
            setIsServerDown(false);
            setText(localStorage.getItem('text') || '');
        }
    }, [roomId]);

    // Сохранение текста (локально или по сети)
    useEffect(() => {
        if (isRemoteUpdate.current) return;
        if (isNetworkMode && roomId) {
            ServerABI.sendText(text);
        } else {
            localStorage.setItem('text', text);
        }
    }, [text, isNetworkMode, roomId]);

    // Размер textarea задаёт высоту холста
    useEffect(() => {
        if (textRef.current) {
            textRef.current.style.height = "auto";
            textRef.current.style.height = `${Math.max(textRef.current.scrollHeight, 240)}px`;
            setDimensions({
                width: containerRef.current?.clientWidth || window.innerWidth,
                height: Math.max(textRef.current.scrollHeight + 160, window.innerHeight - 90),
            });
        }
    }, [text]);

    // Холст следует за шириной контейнера: у вкладки, открытой в фоне,
    // window.innerWidth равен нулю, и Stage остаётся нулевой ширины навсегда
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            if (w > 0) setDimensions(prev => (prev.width === w ? prev : { ...prev, width: w }));
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const removeStroke = useCallback((id: string) => {
        setLines(prev => prev.filter(l => l.id !== id));
        if (isNetworkMode) ServerABI.sendRemoveLine(id);
    }, [isNetworkMode]);

    // undo / redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
            if (document.activeElement?.tagName === 'TEXTAREA') return;

            if (ctrlKey && (e.key === 'z' || e.key === 'я')) {
                e.preventDefault();
                if (lines.length) {
                    const undone = lines[lines.length - 1];
                    removeStroke(undone.id);
                    setUndoStack(prev => [...prev.slice(-9), undone]);
                }
            }
            if (ctrlKey && (e.key === 'y' || e.key === 'н')) {
                e.preventDefault();
                if (undoStack.length) {
                    const restored = undoStack[undoStack.length - 1];
                    setLines(prev => [...prev, restored]);
                    setUndoStack(prev => prev.slice(0, -1));
                    if (isNetworkMode) ServerABI.sendDrawLine(restored);
                }
            }
            // Инструменты под рукой, как во взрослых редакторах
            if (!ctrlKey && (e.key === 'e' || e.key === 'у')) setTool('eraser');
            if (!ctrlKey && (e.key === 'b' || e.key === 'и')) setTool('pen');
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lines, undoStack, isNetworkMode, removeStroke]);

    /** Штрих, попавший под ластик: ищем ближайшую точку любой линии. */
    const strokeAt = (x: number, y: number): Stroke | undefined =>
        [...lines].reverse().find(l => {
            for (let i = 0; i < l.points.length; i += 2) {
                if (Math.hypot(l.points[i] - x, l.points[i + 1] - y) <= ERASER_RADIUS + (l.width ?? 2)) return true;
            }
            return false;
        });

    const pointerPos = (e: KonvaEventObject<MouseEvent | TouchEvent>) =>
        e.target.getStage()?.getPointerPosition();

    const handlePointerDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (!drawingMode) return;
        const pos = pointerPos(e);
        if (!pos) return;

        if (tool === 'eraser') {
            const victim = strokeAt(pos.x, pos.y);
            if (victim) removeStroke(victim.id);
            setIsDrawing(true);
            return;
        }

        setIsDrawing(true);
        const newLine: Stroke = { id: newId(), points: [pos.x, pos.y], color, width };
        setLines(prev => [...prev, newLine]);
        setUndoStack([]);
        if (isNetworkMode) ServerABI.sendDrawLine(newLine);
    };

    const handlePointerMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (!isDrawing || !drawingMode) return;
        const pos = pointerPos(e);
        if (!pos) return;

        if (tool === 'eraser') {
            const victim = strokeAt(pos.x, pos.y);
            if (victim) removeStroke(victim.id);
            return;
        }

        setLines(prev => {
            if (!prev.length) return prev;
            const last = prev[prev.length - 1];
            const points = [...last.points, pos.x, pos.y];
            if (isNetworkMode) ServerABI.sendUpdateLine(last.id, points);
            return [...prev.slice(0, -1), { ...last, points }];
        });
    };

    const handlePointerUp = () => setIsDrawing(false);

    const handleClearLines = () => {
        setLines([]);
        setUndoStack([]);
        if (isNetworkMode) ServerABI.sendClearLines();
    };

    /** Скачиваем рисунок с фоном текущего режима — прозрачный PNG выглядит сломанным. */
    const handleExport = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const source = stage.toCanvas({ pixelRatio: 2 } as any) as HTMLCanvasElement;
        const out = document.createElement('canvas');
        out.width = source.width;
        out.height = source.height;
        const ctx = out.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(source, 0, 0);
        const link = document.createElement('a');
        link.download = `drawer-${roomId ?? 'local'}.png`;
        link.href = out.toDataURL('image/png');
        link.click();
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    const toggleTheme = () => {
        setIsDark(!isDarkState);
        setIsDarkState(!isDarkState);
    };

    const chip: React.CSSProperties = {
        display: "inline-flex", alignItems: "center", gap: ".45rem",
        padding: ".5rem .8rem", borderRadius: 999,
        font: "500 .78rem/1 var(--lb-mono)", color: "var(--lb-dim)",
    };

    const toolBtn = (active: boolean): React.CSSProperties => ({
        display: "grid", placeItems: "center",
        width: 38, height: 38, borderRadius: 11, cursor: "pointer",
        border: `1px solid ${active ? "transparent" : "var(--lb-line)"}`,
        background: active ? "var(--lb-flow)" : "transparent",
        color: active ? "var(--lb-ink)" : "var(--lb-dim)",
        transition: "background .18s, color .18s, border-color .18s",
    });

    return (
        <div style={{
            position: "fixed", inset: 0, display: "flex", flexDirection: "column",
            background: "var(--lb-void)", color: "var(--lb-text)",
        }}>
            {/* ── Верхняя панель ───────────────────────────── */}
            <header style={{
                position: "relative", zIndex: 10,
                display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap",
                padding: ".7rem clamp(.7rem, 2.5vw, 1.4rem)",
                borderBottom: "1px solid var(--lb-line)",
                background: "var(--lb-veil)",
            }}>
                <button
                    className="lb-glass"
                    onClick={() => navigate('/')}
                    aria-label="На главную"
                    style={{ ...toolBtn(false), background: "var(--lb-surface)" }}
                >
                    <ArrowLeft size={18} />
                </button>

                <span style={{ font: "800 1rem/1 var(--lb-ui)", letterSpacing: "-.02em", marginRight: ".2rem" }}>
                    draw<span className="lb-flow-text">er</span>
                </span>

                {isNetworkMode ? (
                    <>
                        <button className="lb-glass" onClick={handleShare} style={{ ...chip, cursor: "pointer", border: "1px solid var(--lb-line)" }}>
                            {copied ? "ссылка скопирована" : `комната ${roomId?.slice(0, 10)}…`}
                        </button>
                        <span className="lb-glass" style={{ ...chip, color: "var(--lb-teal)" }}>
                            <Users size={14} /> {userCount} онлайн
                        </span>
                    </>
                ) : (
                    <span className="lb-glass" style={chip}>локальный режим</span>
                )}

                <button
                    className="lb-glass"
                    onClick={toggleTheme}
                    aria-label={isDarkState ? "Дневной режим" : "Ночной режим"}
                    style={{ ...toolBtn(false), marginLeft: "auto", background: "var(--lb-surface)" }}
                >
                    {isDarkState ? <Sun size={17} /> : <Moon size={17} />}
                </button>
            </header>

            {/* ── Плашка про отсутствующий сервер ──────────── */}
            {isNetworkMode && isServerDown && (
                <div className="lb-glass" style={{
                    position: "absolute", zIndex: 20, top: "4.6rem", left: "50%",
                    transform: "translateX(-50%)", width: "min(34rem, 92%)",
                    display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
                    padding: ".9rem 1.1rem", borderLeft: "3px solid var(--lb-amber)",
                    font: "400 .92rem/1.5 var(--lb-ui)", boxShadow: "var(--lb-lift)",
                }}>
                    <span style={{ flex: "1 1 14rem", color: "var(--lb-dim)" }}>
                        Сервер комнат не подключён — синхронизации не будет.
                        Локальный режим работает без него.
                    </span>
                    <button className="lb-btn-primary" style={{ padding: "10px 16px", fontSize: ".85rem" }}
                        onClick={() => navigate('/Draw/local')}>
                        Локальный режим
                    </button>
                </div>
            )}

            {/* ── Холст и текст ────────────────────────────── */}
            <div
                ref={containerRef}
                style={{ position: "relative", flex: 1, overflowY: "auto", overflowX: "hidden" }}
            >
                <textarea
                    ref={textRef}
                    style={{
                        display: "block", width: "100%", minHeight: "15rem",
                        padding: "1.4rem clamp(1rem, 3vw, 2rem) 7rem",
                        background: "transparent", color: "var(--lb-text)",
                        font: "400 clamp(1rem, 1.1rem + .3vw, 1.25rem)/1.7 var(--lb-ui)",
                        border: "none", outline: "none", resize: "none",
                        position: "relative", zIndex: 1,
                        caretColor: color,
                    }}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={phrase}
                />

                <Stage
                    ref={stageRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    style={{
                        position: "absolute", top: 0, left: 0, zIndex: 2,
                        pointerEvents: drawingMode ? "auto" : "none",
                        cursor: tool === 'eraser' ? "cell" : "crosshair",
                        touchAction: "none",
                    }}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                >
                    <Layer>
                        {lines.map(line => (
                            <Line
                                key={line.id}
                                points={line.points}
                                stroke={line.color ?? theme.inks[0]}
                                strokeWidth={line.width ?? 2}
                                tension={0.4}
                                lineCap="round"
                                lineJoin="round"
                                shadowColor={line.color ?? theme.inks[0]}
                                shadowBlur={theme.glow}
                                shadowOpacity={theme.glow ? 0.9 : 0}
                                listening={false}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>

            {/* ── Панель инструментов ──────────────────────── */}
            {/* Обёртка центрирует панель: у motion.div свой transform, и translateX(-50%) он бы перебил */}
            <div style={{
                position: "absolute", zIndex: 15, left: 0, right: 0,
                bottom: "clamp(.8rem, 2.5vw, 1.6rem)",
                display: "flex", justifyContent: "center",
                padding: "0 .8rem", pointerEvents: "none",
            }}>
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .45, ease: "easeOut" }}
                className="lb-glass"
                style={{
                    display: "flex", alignItems: "center", gap: ".45rem", flexWrap: "wrap",
                    justifyContent: "center", pointerEvents: "auto",
                    padding: ".5rem .6rem", maxWidth: "100%",
                    boxShadow: "var(--lb-lift)",
                }}
            >
                <button style={toolBtn(drawingMode && tool === 'pen')} title="Перо (B)"
                    onClick={() => { setDrawingMode(true); setTool('pen'); }}>
                    <PenLine size={17} />
                </button>
                <button style={toolBtn(drawingMode && tool === 'eraser')} title="Ластик (E)"
                    onClick={() => { setDrawingMode(true); setTool('eraser'); }}>
                    <Eraser size={17} />
                </button>

                <span style={{ width: 1, height: 26, background: "var(--lb-line)", margin: "0 .25rem" }} />

                {theme.inks.map(ink => (
                    <button
                        key={ink}
                        title="Цвет штриха"
                        onClick={() => { setColor(ink); setTool('pen'); setDrawingMode(true); }}
                        style={{
                            width: 24, height: 24, borderRadius: "50%", cursor: "pointer",
                            background: ink, border: color === ink ? "2px solid var(--lb-text)" : "2px solid transparent",
                            boxShadow: color === ink && theme.glow ? `0 0 12px ${ink}` : "none",
                            transition: "box-shadow .18s, border-color .18s",
                        }}
                    />
                ))}

                <span style={{ width: 1, height: 26, background: "var(--lb-line)", margin: "0 .25rem" }} />

                {WIDTHS.map(w => (
                    <button
                        key={w}
                        title={`Толщина ${w}`}
                        onClick={() => setWidth(w)}
                        style={{ ...toolBtn(width === w), width: 32, height: 32 }}
                    >
                        <span style={{
                            display: "block", width: w + 6, height: w + 6, borderRadius: "50%",
                            background: width === w ? "var(--lb-ink)" : "var(--lb-dim)",
                        }} />
                    </button>
                ))}

                <span style={{ width: 1, height: 26, background: "var(--lb-line)", margin: "0 .25rem" }} />

                <button style={toolBtn(false)} title="Отменить (Ctrl+Z)"
                    onClick={() => {
                        if (!lines.length) return;
                        const undone = lines[lines.length - 1];
                        removeStroke(undone.id);
                        setUndoStack(prev => [...prev.slice(-9), undone]);
                    }}>
                    <Undo2 size={17} />
                </button>
                <button style={toolBtn(false)} title="Очистить холст" onClick={handleClearLines}>
                    <Trash2 size={17} />
                </button>
                <button style={toolBtn(false)} title="Скачать PNG" onClick={handleExport}>
                    <Download size={17} />
                </button>
            </motion.div>
            </div>
        </div>
    );
};
