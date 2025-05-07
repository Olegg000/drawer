import React, {useEffect, useRef, useState} from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import {useDispatch} from "react-redux";
import {useNavigate} from "react-router-dom";
import {ServerABI} from "../abi/ServerABI";
import {delay} from "../utils/delay";
import {CreateComponent} from "../Components/CreateComponent";

export const StartPage: React.FC = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const roomsRef = useRef<HTMLDivElement>(null);
    const [mockRooms, setMockRooms] = useState<{ id: string; name: string }[]>([]); // Инициализация mockRooms пустым массивом
    const [isCreating, setIsCreating] = useState(false);
    const dispatch = useDispatch();

    const navigate = useNavigate();
    let globalI = 0

    // Скроллим вниз к секции с комнатами
    const handleScrollDown = () => {
        roomsRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Скроллим вверх к герою
    const handleScrollUp = () => {
        heroRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Отключаем стандартное прокручивание, если нужно (иначе можно оставить)
    useEffect(() => {
        const preventScroll = (e: Event) => e.preventDefault();
        window.addEventListener("wheel", preventScroll, { passive: false });
        window.addEventListener("touchmove", preventScroll, { passive: false });
        return () => {
            window.removeEventListener("wheel", preventScroll);
            window.removeEventListener("touchmove", preventScroll);
        };
    }, []);

    useEffect(() => {
        const tryConnect = async () => {
            ServerABI.connect()
            console.log(ServerABI.isWork);
            if (!ServerABI.isWork) {
                for (let i = 0;i<5;i++){
                    if (i == 0) {
                        await delay(500)
                    } else {
                        await delay(5000)
                    }
                    console.log(ServerABI.isWork);
                    if (ServerABI.isWork) {
                        break;
                    }
                }
            }
            if (ServerABI.isWork) {
                console.log("Connected");
                setMockRooms([
                    {id: "1", name: "Комната 1"},
                    {id: "2", name: "Комната 2"},
                    {id: "3", name: "Комната 3"},
                    {id: "4", name: "Комната 4"},
                    {id: "5", name: "Комната 5"},
                ]);
            }
        }
        if (globalI == 0) {
            globalI = 1
            tryConnect();
        }

    }, []);

    return (
        <>
            <div
                ref={heroRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100vh",
                    overflow: "hidden",
                    backgroundColor: "black",
                    fontFamily: '"Space Grotesk", sans-serif',
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: "url('background.png')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        zIndex: -1,
                    }}
                />
                <img
                    src='background.png'
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
                <video
                    src="/video/background.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />


                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "100%",
                        textAlign: "center",
                        color: "white",
                        padding: "0 1rem",
                    }}
                >
                    <motion.h1
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        style={{
                            fontSize: "clamp(4rem, 9vw, 12rem)",
                            fontWeight: "800",
                            lineHeight: "1.1",
                            letterSpacing: "-0.04em",
                            textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                            marginBottom: "2rem",
                        }}
                    >
                        DRAWER
                    </motion.h1>

                    <motion.div
                        initial={{  y: 50 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 1 }}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            gap: "2rem",
                            marginBottom: "3rem",
                        }}
                    >
                        {["Создать", "Войти"].map((label) => (
                            <button
                                key={label}
                                style={{
                                    padding: "1rem 3rem",
                                    borderRadius: "100px",
                                    backgroundColor: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white",
                                    width: "250px",
                                    fontSize: "1.25rem",
                                    fontWeight: "600",
                                    backdropFilter: "blur(10px)",
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    if (label == 'Создать') {
                                        setIsCreating(true);
                                    }
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                        "rgba(255,255,255,0.1)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                        "rgba(255,255,255,0.04)")
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 0.6, y: [30, -15, 170] }}
                        transition={{ duration: 2}}
                        style={{
                            display: "inline-block",
                            padding: "5px",
                            margin: "50px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            color: "#999",
                        }}
                        onClick={handleScrollDown}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#c3c2c2")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#999")
                        }
                    >
                        <ArrowDown size={60} />
                    </motion.div>

                </div>
                {isCreating && (
                    <CreateComponent style={{
                        borderRadius: "50px",
                        backdropFilter: "blur(10px)",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        zIndex: 9999
                    }} className='card' closeCreate={() => {setIsCreating(!isCreating)}}/>
                )}
            </div>

            <div
                ref={roomsRef}
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#111",
                    color: "#fff",
                    padding: "4rem 2rem",
                    textAlign: "center",
                    position: "relative",
                }}
            >

                <h2 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>
                    Последние комнаты
                </h2>

                {mockRooms.length > 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1.5rem",
                            alignItems: "center",
                        }}
                    >
                        {mockRooms.map((room) => (
                            <div
                                key={room.id}
                                style={{
                                    padding: "1rem 2rem",
                                    backgroundColor: "#222",
                                    borderRadius: "12px",
                                    width: "min(400px, 90%)",
                                    border: "1px solid #333",
                                    cursor: "pointer",
                                    fontSize: "1.2rem",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = "rgba(34,34,34,0.54)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = "#222")
                                }
                            >
                                {room.name}
                            </div>
                        ))}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 0.6, y: [30, -15, 20] }}
                            transition={{ duration: 2}}
                            style={{
                                bottom: "2rem",
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "inline-block",
                                padding: "5px",
                                marginTop: "10rem",
                                borderRadius: "10px",
                                cursor: "pointer",
                                color: "#999",
                            }}
                            onClick={handleScrollUp}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.color = "#c3c2c2")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.color = "#999")
                            }
                        >
                            <ArrowUp size={60} />
                        </motion.div>
                    </div>
                ) : (<>
                    <p style={{ fontSize: "1.25rem", color: "#aaa" }}>
                        У вас пока нет комнат 😔
                    </p>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 0.6, y: [30, -15, 20] }}
                            transition={{ duration: 2}}
                            style={{
                                bottom: "2rem",
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "inline-block",
                                padding: "5px",
                                marginTop: "4rem",
                                borderRadius: "10px",
                                cursor: "pointer",
                                color: "#999",
                                top: "90px"
                            }}
                            onClick={handleScrollUp}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.color = "#c3c2c2")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.color = "#999")
                            }
                        >
                            <ArrowUp size={60} />
                        </motion.div>
                    </>
                )}

            </div>
        </>
    );
};
