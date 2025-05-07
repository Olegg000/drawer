import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { darkTheme } from "../types/theme";
import { Sun } from "../sourses/Sun";
import { Moon } from "../sourses/Moon";
import Switch from "react-switch";
import { Stage, Layer, Line } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import {getRandomPhrase} from "../utils/getRandomPhrase";
import {motion} from "framer-motion";
import {ArrowDown, ArrowLeft} from "lucide-react";
import {useNavigate} from "react-router-dom";

export const DrawPage: React.FC<{ setIsDark: Dispatch<SetStateAction<boolean>> }> = ({ setIsDark }) => {
    const [text, setText] = useState<string>(localStorage.getItem('text') || '');
    const [lines, setLines] = useState<{ points: number[] }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingMode, setDrawingMode] = useState(false);
    const [isDarkState, setIsDarkState] = useState(localStorage.getItem('theme') === 'dark');
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [undoStack, setUndoStack] = useState<{ points: number[] }[]>([]);
    const [redoStack, setRedoStack] = useState<{ points: number[] }[]>([]);
    const [phrase, setPhrase] = useState<string>(() => getRandomPhrase());
    const navigate = useNavigate();

    const textRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();

    // Завершаем рисование при уходе мышки, но дописываем точку выхода
    const handleStageMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        if (!stage) return;

        // вычисляем координаты мыши относительно канвы
        const container = stage.container().getBoundingClientRect();
        const x = Math.max(0, Math.min(e.evt.clientX - container.left, dimensions.width));
        const y = Math.max(0, Math.min(e.evt.clientY - container.top, dimensions.height));

        // дописываем эту точку в последнюю линию
        setLines(prev => {
            const last = prev[prev.length - 1];
            const newPoints = [...last.points, x, y];
            return [...prev.slice(0, -1), { points: newPoints }];
        });

        setIsDrawing(false);
    };

    // Для надёжности ловим mouseout за пределы окна
    useEffect(() => {
        const handleWindowMouseOut = (e: MouseEvent) => {
            if (e.relatedTarget === null && isDrawing) {
                // просто завершаем, без дописи — уже поймали в канве
                setIsDrawing(false);
            }
        };
        window.addEventListener("mouseout", handleWindowMouseOut);
        return () => window.removeEventListener("mouseout", handleWindowMouseOut);
    }, [isDrawing]);

    // textarea + локалсторадж
    useEffect(() => {
        if (textRef.current) {
            textRef.current.style.height = "auto";
            textRef.current.style.height = `${textRef.current.scrollHeight - 80}px`;
            setDimensions({ width: window.innerWidth, height: textRef.current.scrollHeight + 100 });
        }
        localStorage.setItem('text', text);
    }, [text]);

    // undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

            if (document.activeElement?.tagName === 'TEXTAREA') return;

            if (ctrlKey && (e.key === 'z' || e.key === 'я')) {
                e.preventDefault();
                if (lines.length) {
                    const newLines = [...lines];
                    const undone = newLines.pop()!;
                    setLines(newLines);
                    setUndoStack(prev => [...prev.slice(-9), undone]);
                    setRedoStack([]);
                }
            }
            if (ctrlKey && (e.key === 'y' || e.key === 'н')) {
                e.preventDefault();
                if (undoStack.length) {
                    const newUndo = [...undoStack];
                    const restored = newUndo.pop()!;
                    setLines(prev => [...prev, restored]);
                    setUndoStack(newUndo);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lines, undoStack]);

    // mouse down — начинаем новую линию
    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        if (!drawingMode) return;
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;
        setIsDrawing(true);
        setLines(prev => [...prev, { points: [pos.x, pos.y] }]);
        setUndoStack([]);
        setRedoStack([]);
    };

    // mouse move — дописываем точки
    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !drawingMode) return;
        const stage = e.target.getStage();
        const point = stage?.getPointerPosition();
        if (!point) return;
        setLines(prev => {
            const last = prev[prev.length - 1];
            const newPoints = [...last.points, point.x, point.y];
            return [...prev.slice(0, -1), { points: newPoints }];
        });
    };

    // mouse up — завершаем
    const handleMouseUp = () => {
        if (isDrawing) setIsDrawing(false);
    };

    return (
        <div className="notepad-holder" style={{ position: "fixed", width: "100%", height: "100vh" }}>
            <div className="notepad" ref={containerRef} style={{ position: "relative", width: "100%", overflowY: 'auto', overflowX: 'hidden' }}>
                <textarea
                    ref={textRef}
                    style={{
                        width: "100%", padding: "1rem",
                        background: isDarkState ? "#121212" : "#ffffff",
                        color: isDarkState ? "#f5f5f5" : "#111",
                        fontSize: "calc(14px + 1vmin)",
                        transition: 'all 0.4s ease-in-out',
                        border: "none", outline: "none", resize: "none", position: "relative",
                    }}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={phrase}
                />

                <Stage
                    width={dimensions.width}
                    height={dimensions.height}
                    style={{ position: "absolute", top: 0, left: 0, pointerEvents: drawingMode ? "auto" : "none" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleStageMouseLeave}
                >
                    <Layer>
                        {lines.map((line, i) => (
                            <Line
                                key={i}
                                points={line.points}
                                stroke={theme === darkTheme ? "aqua" : "#000000"}
                                strokeWidth={2}
                                tension={0.5}
                                lineCap="round"
                            />
                        ))}
                    </Layer>
                </Stage>

                <div className="notepad-label-container" style={{
                    width: '100%', borderBottom: isDarkState ? '3px solid #444' : '3px solid #ccc',
                    boxShadow: isDarkState ? '0px 4px 10px rgba(0,0,0,0.6)' : '0px 4px 12px rgba(0,0,0,0.1)',
                    borderRadius: '0 0 20px 20px', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.4s ease-in-out', position: "sticky",
                    background: isDarkState ? "#1f1f1f" : "#f9f9f9",
                }}>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: [30, 0] }}
                        transition={{ duration: 2}}
                        style={{
                            display: "inline-block",
                            padding: "5px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            marginTop: "5px",
                            color: "#999",
                        }}
                        onClick={() => navigate('/')}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#c3c2c2")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#999")
                        }
                    >
                        <ArrowLeft size={60} />
                    </motion.div>
                    <button onClick={() => setLines([])}>Очистить рисование</button>
                    <button onClick={() => setDrawingMode(!drawingMode)}>
                        {drawingMode ? 'Остановить рисование' : 'Начать рисовать'}
                    </button>
                    <span>Привет</span>
                    <label style={{ margin: "4px 10px 4px 4px", display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: "calc(13px + 1vmin)", marginRight: "10px" }}>Сменить тему:</span>
                        <Switch
                            onChange={() => { setIsDark(!isDarkState); setIsDarkState(!isDarkState); }}
                            checked={isDarkState}
                            checkedIcon={<Moon style={{ marginLeft: "4px", marginTop: "2px" }} />}
                            uncheckedIcon={<Sun style={{ marginTop: "2px", marginLeft: "6px", color: "#fff7d6" }} />}
                            height={40} width={80} handleDiameter={30}
                            offHandleColor={'#ffcd06'} onHandleColor={'#80a1ec'}
                            onColor={'#3a70e4'} offColor={'#cfc393'} activeBoxShadow={'0 0 4px 6px #ac8ed3'}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};
