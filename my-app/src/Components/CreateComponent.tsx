import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {HTMLMotionProps, motion} from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import {useNavigate} from "react-router-dom";
import { Card } from './Card';
import {CardContent} from "./CardContent";
import {ImageViewer} from "./ImageViewer";
import {ServerABI} from "../abi/ServerABI";

export const CreateComponent: React.FC<HTMLMotionProps<"div"> & { closeCreate: () => void }> = ({closeCreate, ...props}) => {
    const [projectName, setProjectName] = useState("");
    const [mode, setMode] = useState("solo");
    const [privacy, setPrivacy] = useState("public");
    const [password, setPassword] = useState("");
    const [fontSize, setFontSize] = useState(64); // 64px ≈ 4rem
    const [warning, setWarning] = useState(false);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const cardRef  = useRef<HTMLDivElement>(null);
    const maxProjectNameLength = 42
    const navigate = useNavigate();

    // после каждого рендера, когда меняется projectName
    useLayoutEffect(() => {
        const titleEl = titleRef.current;
        const cardEl  = cardRef.current;
        if (!titleEl || !cardEl) return;

        const containerW = cardEl.clientWidth - 64; // padding: 1rem слева и справа
        let size = 64;
        // уменьшаем, пока не поместится
        while (size > 16) {
            titleEl.style.fontSize = `${size}px`;
            if (titleEl.scrollWidth <= containerW) break;
            size -= 2;
        }
        setFontSize(size);
    }, [projectName]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length+1 > maxProjectNameLength) {
            setWarning(true);
        } else {
            setWarning(false);
            setProjectName(value);
        }
    };

    const create = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigate('/draw')
    }

    return (
        <motion.div
            ref={cardRef}
            initial={{ scale: 0.8, opacity: 0, x: '-20%', y: "+50%" }}
            animate={{ scale: 1, opacity: 1, x: '0', y: "0" }}
            transition={{ duration: 0.3 }}
            {...props}
        >
            <Card>
                <CardContent>
                    <h2 ref={titleRef} className='card-logo' style={{ fontSize: `${fontSize}px` }}>{projectName || "Новый проект"}</h2>
                    <form onSubmit={async (e) => {await create(e)}}>

                        <div>
                            <ImageViewer src='background.png' width={576} height={324} imgScale={0.3}/>
                        </div>

                        <div>
                            <label>Название проекта</label>
                            <input
                                type="text"
                                value={projectName}
                                maxLength={maxProjectNameLength}
                                onChange={(e) => handleInputChange(e)}
                            />

                        </div>
                        {warning && (
                            <p style={{color:"red",margin:'1px',fontSize:'0.88rem'}}>Максимум {maxProjectNameLength} символов!</p>
                        )}

                        <div>
                            <span>Режим:</span>
                            <label>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="solo"
                                    checked={mode === 'solo'}
                                    onChange={() => setMode('solo')}
                                />
                                Локальный
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="network"
                                    disabled={!ServerABI.isWork}
                                    checked={mode === 'network'}
                                    onChange={() => setMode('network')}
                                />
                                По сети
                            </label>
                        </div>

                        {mode === 'network' && (
                            <div>
                                <span>Доступ:</span>
                                <label>
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value="public"
                                        checked={privacy === 'public'}
                                        onChange={() => setPrivacy('public')}
                                    />
                                    Публичное
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value="private"
                                        checked={privacy === 'private'}
                                        onChange={() => setPrivacy('private')}
                                    />
                                    Приватное
                                </label>

                                {privacy === 'private' && (
                                    <input
                                        type="password"
                                        placeholder="Пароль комнаты"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                )}
                            </div>
                        )}

                        <div>
                            <button type="button" onClick={() => {closeCreate()}}>
                                Отмена
                            </button>
                            <button type="submit">
                                Создать
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>)
}