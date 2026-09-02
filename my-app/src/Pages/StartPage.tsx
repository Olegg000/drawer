import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ServerABI } from "../abi/ServerABI";
import { delay } from "../utils/delay";
import { CreateComponent } from "../Components/CreateComponent";
import { GlowCanvas } from "../Components/GlowCanvas";

const FEATURES = [
    { title: "Свой цвет у каждого", text: "Штрихи участников светятся разными цветами — видно, кто что нарисовал." },
    { title: "Мгновенная синхронизация", text: "Линии и текст расходятся по комнате через WebSocket, без перезагрузок." },
    { title: "Работает и в одиночку", text: "Локальный режим держит доску в браузере — без сервера и регистрации." },
    { title: "Ставится как приложение", text: "PWA: доска открывается с рабочего стола и помнит последнюю сессию." },
];

export const StartPage: React.FC = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const roomsRef = useRef<HTMLDivElement>(null);
    const [mockRooms, setMockRooms] = useState<{ id: string; name: string }[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [visited, setVisited] = useState<{ id: string; visitedAt: number }[]>([]);
    const navigate = useNavigate();
    const hasConnected = useRef(false);

    // Список комнат, куда уже заходили: живёт в браузере и работает без сервера
    useEffect(() => {
        try {
            const raw = localStorage.getItem('drawer:rooms');
            if (raw) setVisited(JSON.parse(raw));
        } catch {
            // приватный режим браузера — списка просто не будет
        }
    }, []);

    useEffect(() => {
        const tryConnect = async () => {
            // На статичном хостинге сервера комнат нет — не ждём его двадцать секунд впустую
            if (!ServerABI.available) return;
            ServerABI.connect();
            if (!ServerABI.isWork) {
                for (let i = 0; i < 5; i++) {
                    await delay(i === 0 ? 500 : 5000);
                    if (ServerABI.isWork) break;
                }
            }
            if (ServerABI.isWork) {
                setMockRooms([
                    { id: "1", name: "Комната 1" },
                    { id: "2", name: "Комната 2" },
                    { id: "3", name: "Комната 3" },
                    { id: "4", name: "Комната 4" },
                    { id: "5", name: "Комната 5" },
                ]);
            }
        };
        if (!hasConnected.current) {
            hasConnected.current = true;
            tryConnect();
        }
    }, []);

    const hasRooms = mockRooms.length > 0;

    return (
        <div style={{ background: "var(--lb-void)", color: "var(--lb-text)", minHeight: "100vh" }}>
            {/* ── Первый экран ─────────────────────────────── */}
            <section
                ref={heroRef}
                style={{
                    position: "relative",
                    minHeight: "100svh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                <GlowCanvas
                    style={{ position: "absolute", inset: 0, zIndex: 0 }}
                />
                {/* Свет из углов — чтобы холст не выглядел плоским */}
                <div
                    aria-hidden
                    className="lb-hero-veil"
                    style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
                />

                <header
                    style={{
                        position: "relative", zIndex: 2,
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "1.1rem clamp(1rem, 4vw, 3rem)",
                    }}
                >
                    <span style={{ font: "800 1.15rem/1 var(--lb-ui)", letterSpacing: "-.02em" }}>
                        draw<span className="lb-flow-text">er</span>
                    </span>
                    <span
                        className="lb-glass lb-mono"
                        style={{
                            marginLeft: "auto", padding: "7px 13px", borderRadius: 999,
                            fontSize: ".72rem", color: "var(--lb-dim)",
                        }}
                    >
                        {hasRooms ? "сервер комнат на связи" : "локальный режим"}
                    </span>
                </header>

                <div
                    style={{
                        position: "relative", zIndex: 2,
                        flex: 1, display: "flex", alignItems: "center",
                        padding: "clamp(1.5rem, 5vw, 4rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 6vw, 5rem)",
                    }}
                >
                    <div style={{ maxWidth: "44rem" }}>
                        <motion.p
                            className="lb-label"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: .6 }}
                            style={{ margin: "0 0 1.1rem" }}
                        >
                            Совместная доска
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: .7, ease: "easeOut" }}
                            style={{
                                font: "800 clamp(2.6rem, 7.5vw, 5.6rem)/1.02 var(--lb-ui)",
                                letterSpacing: "-.04em",
                                margin: "0 0 1.2rem",
                                textWrap: "balance",
                            }}
                        >
                            Рисуйте <span className="lb-flow-text">светом</span>,<br />вместе и сразу
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: .7, delay: .12 }}
                            style={{
                                font: "400 clamp(1rem, 1.9vw, 1.2rem)/1.6 var(--lb-ui)",
                                color: "var(--lb-dim)", maxWidth: "34rem", margin: "0 0 2rem",
                            }}
                        >
                            Общий холст и общий текст в одной вкладке. Каждый участник рисует
                            своим цветом, линии загораются у всех одновременно.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: .7, delay: .22 }}
                            style={{ display: "flex", flexWrap: "wrap", gap: ".85rem", marginBottom: "1.1rem" }}
                        >
                            <button className="lb-btn-primary" onClick={() => navigate("/Draw/local")}>
                                Открыть доску
                            </button>
                            <button className="lb-btn" onClick={() => setIsCreating(true)}>
                                Создать комнату
                            </button>
                            <button
                                className="lb-btn"
                                onClick={() => roomsRef.current?.scrollIntoView({ behavior: "smooth" })}
                            >
                                Комнаты
                            </button>
                        </motion.div>

                        <p className="lb-mono" style={{ fontSize: ".78rem", color: "var(--lb-faint)", margin: 0 }}>
                            {hasRooms
                                ? "Комнаты синхронизируются через WebSocket"
                                : "Без сервера и регистрации · рисунок и текст остаются в браузере"}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Что умеет ────────────────────────────────── */}
            <section style={{ padding: "clamp(3rem, 7vw, 5.5rem) clamp(1rem, 4vw, 3rem)" }}>
                <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
                    <p className="lb-label" style={{ margin: "0 0 .8rem" }}>Возможности</p>
                    <h2
                        style={{
                            font: "800 clamp(1.5rem, 3.4vw, 2.3rem)/1.15 var(--lb-ui)",
                            letterSpacing: "-.025em", margin: "0 0 2.2rem", textWrap: "balance",
                        }}
                    >
                        Доска, а не белый прямоугольник
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
                            gap: "1rem",
                        }}
                    >
                        {FEATURES.map((f, i) => (
                            <motion.article
                                key={f.title}
                                className="lb-glass"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: .5, delay: i * .06 }}
                                style={{ padding: "1.4rem 1.3rem" }}
                            >
                                <h3 style={{ font: "600 1.02rem/1.3 var(--lb-ui)", margin: "0 0 .5rem" }}>
                                    {f.title}
                                </h3>
                                <p style={{ font: "400 .92rem/1.55 var(--lb-ui)", color: "var(--lb-dim)", margin: 0 }}>
                                    {f.text}
                                </p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Комнаты ─────────────────────────────────── */}
            <section ref={roomsRef} style={{ padding: "0 clamp(1rem, 4vw, 3rem) clamp(3rem, 7vw, 5.5rem)" }}>
                <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
                    <p className="lb-label" style={{ margin: "0 0 .8rem" }}>Комнаты</p>
                    <h2 style={{
                        font: "800 clamp(1.5rem, 3.4vw, 2.3rem)/1.15 var(--lb-ui)",
                        letterSpacing: "-.025em", margin: "0 0 1.6rem", textWrap: "balance",
                    }}>
                        Последние комнаты
                    </h2>

                    {visited.length > 0 && (
                        <>
                            <p className="lb-mono" style={{ fontSize: ".76rem", color: "var(--lb-faint)", margin: "0 0 .8rem" }}>
                                вы здесь уже были
                            </p>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))",
                                gap: ".9rem", marginBottom: hasRooms ? "2rem" : "1.4rem",
                            }}>
                                {visited.map(room => (
                                    <button
                                        key={room.id}
                                        className="lb-glass"
                                        onClick={() => navigate(`/Draw/${room.id}`)}
                                        style={{
                                            textAlign: "left", cursor: "pointer", color: "var(--lb-text)",
                                            padding: "1.1rem 1.2rem", font: "600 .95rem/1.3 var(--lb-ui)",
                                            overflow: "hidden", textOverflow: "ellipsis",
                                        }}
                                    >
                                        {room.id}
                                        <span className="lb-mono" style={{ display: "block", marginTop: ".4rem", fontSize: ".72rem", color: "var(--lb-faint)" }}>
                                            {new Date(room.visitedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · вернуться →
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {hasRooms ? (
                        <>
                            <p className="lb-mono" style={{ fontSize: ".76rem", color: "var(--lb-faint)", margin: "0 0 .8rem" }}>
                                открыты на сервере
                            </p>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(13rem, 1fr))",
                                gap: ".9rem",
                            }}>
                                {mockRooms.map(room => (
                                    <button
                                        key={room.id}
                                        className="lb-glass"
                                        onClick={() => navigate(`/Draw/${room.id}`)}
                                        style={{
                                            textAlign: "left", cursor: "pointer", color: "var(--lb-text)",
                                            padding: "1.1rem 1.2rem", font: "600 1rem/1.3 var(--lb-ui)",
                                        }}
                                    >
                                        {room.name}
                                        <span className="lb-mono" style={{ display: "block", marginTop: ".4rem", fontSize: ".72rem", color: "var(--lb-faint)" }}>
                                            войти →
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="lb-glass" style={{ padding: "1.3rem 1.4rem", maxWidth: "46rem" }}>
                            <p style={{ margin: "0 0 .9rem", color: "var(--lb-dim)", font: "400 .95rem/1.6 var(--lb-ui)" }}>
                                Общих комнат сейчас нет: сервер Socket.IO не отвечает. На демо его и не может
                                быть — GitHub Pages отдаёт только статику. Поднимите сервер локально
                                (<span className="lb-mono" style={{ fontSize: ".88em" }}>server/</span>, порт 8000),
                                и комнаты появятся здесь.
                            </p>
                            <button className="lb-btn" style={{ padding: "11px 18px", fontSize: ".92rem" }}
                                onClick={() => navigate('/Draw/local')}>
                                Открыть локальную доску
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <footer
                style={{
                    borderTop: "1px solid var(--lb-line)",
                    padding: "1.6rem clamp(1rem, 4vw, 3rem) 2.4rem",
                }}
            >
                <p className="lb-mono" style={{ fontSize: ".74rem", color: "var(--lb-faint)", margin: 0 }}>
                    Drawer · совместная доска в реальном времени
                </p>
            </footer>

            {isCreating && <CreateComponent closeCreate={() => setIsCreating(false)} />}
        </div>
    );
};
