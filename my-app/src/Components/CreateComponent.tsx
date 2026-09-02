import React, { useState } from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServerABI } from "../abi/ServerABI";
import { GlowCanvas } from "./GlowCanvas";

const MAX_NAME = 42;

export const CreateComponent: React.FC<HTMLMotionProps<"div"> & { closeCreate: () => void }> = ({ closeCreate, ...props }) => {
    const [projectName, setProjectName] = useState("");
    const [mode, setMode] = useState("solo");
    const [privacy, setPrivacy] = useState("public");
    const [password, setPassword] = useState("");
    const [warning, setWarning] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length > MAX_NAME) {
            setWarning(true);
        } else {
            setWarning(false);
            setProjectName(value);
        }
    };

    const create = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (mode === 'network') {
            // Генерируем уникальный ID комнаты
            const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            navigate(`/Draw/${roomId}`);
        } else {
            // Локальный режим - без roomId
            navigate('/Draw/local');
        }
    };

    const field: React.CSSProperties = {
        width: "100%", padding: ".8rem 1rem",
        background: "var(--lb-surface)", color: "var(--lb-text)",
        border: "1px solid var(--lb-line)", borderRadius: 10,
        font: "400 1rem/1.4 var(--lb-ui)", outline: "none",
    };

    const option = (active: boolean): React.CSSProperties => ({
        flex: "1 1 8rem", padding: ".7rem .9rem", borderRadius: 10, cursor: "pointer",
        textAlign: "center", font: "600 .9rem/1.2 var(--lb-ui)",
        border: `1px solid ${active ? "transparent" : "var(--lb-line)"}`,
        background: active ? "var(--lb-flow)" : "transparent",
        color: active ? "var(--lb-ink)" : "var(--lb-dim)",
        transition: "background .18s, color .18s, border-color .18s",
    });

    return (
        <div
            onClick={closeCreate}
            style={{
                position: "fixed", inset: 0, zIndex: 50,
                display: "grid", placeItems: "center", padding: "1rem",
                background: "rgba(4, 4, 8, .68)", backdropFilter: "blur(6px)",
            }}
        >
            <motion.div
                initial={{ scale: .94, opacity: 0, y: 18 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: .28, ease: "easeOut" }}
                onClick={e => e.stopPropagation()}
                className="lb-glass"
                style={{
                    position: "relative", width: "min(32rem, 100%)",
                    maxHeight: "90svh", overflowY: "auto",
                    background: "var(--lb-veil)", boxShadow: "var(--lb-lift)",
                }}
                {...props}
            >
                {/* Живая шапка вместо статичной картинки на 2,8 МБ */}
                <div style={{ position: "relative", height: "8.5rem", overflow: "hidden", borderRadius: "var(--lb-r) var(--lb-r) 0 0" }}>
                    <GlowCanvas style={{ position: "absolute", inset: 0 }} />
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(180deg, rgba(7,7,10,.1), var(--lb-veil))",
                    }} />
                    <h2 style={{
                        position: "absolute", left: "1.4rem", bottom: ".9rem", right: "3.5rem",
                        font: "800 clamp(1.2rem, 4vw, 1.7rem)/1.15 var(--lb-ui)",
                        letterSpacing: "-.02em", margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {projectName || "Новая доска"}
                    </h2>
                </div>

                <button
                    onClick={closeCreate}
                    aria-label="Закрыть"
                    style={{
                        position: "absolute", top: ".8rem", right: ".8rem",
                        display: "grid", placeItems: "center", width: 34, height: 34,
                        borderRadius: 10, cursor: "pointer",
                        background: "rgba(10,10,16,.45)", border: "1px solid var(--lb-line)",
                        color: "var(--lb-text)",
                    }}
                >
                    <X size={17} />
                </button>

                <form onSubmit={create} style={{ display: "grid", gap: "1.1rem", padding: "1.4rem" }}>
                    <div>
                        <label htmlFor="project-name" className="lb-label" style={{ display: "block", marginBottom: ".5rem" }}>
                            Название
                        </label>
                        <input
                            id="project-name"
                            type="text"
                            value={projectName}
                            maxLength={MAX_NAME}
                            placeholder="Например: схема сервиса"
                            onChange={handleInputChange}
                            style={field}
                        />
                        {warning && (
                            <p style={{ color: "var(--lb-rose)", margin: ".4rem 0 0", font: "400 .82rem/1.4 var(--lb-ui)" }}>
                                Максимум {MAX_NAME} символа
                            </p>
                        )}
                    </div>

                    <div>
                        <span className="lb-label" style={{ display: "block", marginBottom: ".5rem" }}>Режим</span>
                        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                            <button type="button" style={option(mode === 'solo')} onClick={() => setMode('solo')}>
                                Личный
                            </button>
                            <button
                                type="button"
                                disabled={!ServerABI.isWork}
                                title={ServerABI.isWork ? undefined : "Сервер комнат не подключён"}
                                style={{ ...option(mode === 'network'), opacity: ServerABI.isWork ? 1 : .45, cursor: ServerABI.isWork ? "pointer" : "not-allowed" }}
                                onClick={() => setMode('network')}
                            >
                                По сети
                            </button>
                        </div>
                        {!ServerABI.isWork && (
                            <p className="lb-mono" style={{ color: "var(--lb-faint)", margin: ".5rem 0 0", fontSize: ".72rem" }}>
                                сервер комнат не отвечает — доступен личный режим
                            </p>
                        )}
                    </div>

                    {mode === 'network' && (
                        <div>
                            <span className="lb-label" style={{ display: "block", marginBottom: ".5rem" }}>Доступ</span>
                            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                                <button type="button" style={option(privacy === 'public')} onClick={() => setPrivacy('public')}>
                                    Публичный
                                </button>
                                <button type="button" style={option(privacy === 'private')} onClick={() => setPrivacy('private')}>
                                    Приватный
                                </button>
                            </div>
                            {privacy === 'private' && (
                                <input
                                    id="room-password"
                                    type="password"
                                    placeholder="Пароль комнаты"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ ...field, marginTop: ".6rem" }}
                                />
                            )}
                        </div>
                    )}

                    <button type="submit" className="lb-btn-primary" style={{ width: "100%" }}>
                        Создать доску
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
