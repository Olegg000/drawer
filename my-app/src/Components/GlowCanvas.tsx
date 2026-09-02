import React, { useEffect, useRef } from "react";

type Pt = [number, number];

/** Штрих задан кубическими кривыми в долях холста (0..1), чтобы масштабироваться под любой экран. */
interface Stroke {
    color: string;
    /** Дневной вариант цвета: мятный и лиловый на белом не читаются. */
    dayColor: string;
    width: number;
    /** Опорные точки: первая — начало, дальше тройками (control1, control2, end). */
    path: Pt[];
    /** Кто «рисует» этот штрих — подпись у ведущей точки. */
    author?: string;
    /** Задержка старта в долях общего цикла. */
    delay: number;
}

const STROKES: Stroke[] = [
    {
        color: "#5eead4", dayColor: "#0d9488", width: 3.2, author: "Олег", delay: 0,
        path: [[0.08, 0.68], [0.20, 0.20], [0.34, 0.86], [0.47, 0.50], [0.60, 0.16], [0.78, 0.28], [0.94, 0.38]],
    },
    {
        color: "#d946ef", dayColor: "#c026d3", width: 2.6, author: "Марина", delay: 0.18,
        path: [[0.14, 0.30], [0.30, 0.58], [0.44, 0.18], [0.60, 0.66], [0.72, 0.92], [0.84, 0.62], [0.92, 0.74]],
    },
    {
        color: "#a78bfa", dayColor: "#7c3aed", width: 2.2, delay: 0.42,
        path: [[0.22, 0.88], [0.36, 0.74], [0.52, 0.92], [0.66, 0.78]],
    },
];

/** Точка на цепочке кубических кривых: t от 0 до 1 по всей длине штриха. */
function pointAt(path: Pt[], t: number): Pt {
    const segments = Math.floor((path.length - 1) / 3);
    const scaled = Math.min(t, 0.999999) * segments;
    const i = Math.floor(scaled);
    const local = scaled - i;
    const p0 = path[i * 3], p1 = path[i * 3 + 1], p2 = path[i * 3 + 2], p3 = path[i * 3 + 3];
    const u = 1 - local;
    const a = u * u * u, b = 3 * u * u * local, c = 3 * u * local * local, d = local * local * local;
    return [
        a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
        a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ];
}

interface GlowCanvasProps {
    /** Ночью штрихи светятся, днём рисуются плотной линией без ореола.
     *  По умолчанию берём режим со страницы. */
    glow?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Фон первого экрана: штрихи прорисовываются сами, будто их ведут несколько человек.
 * Ведущая точка каждого штриха тянет за собой подпись автора — та самая совместность,
 * ради которой доска и существует.
 */
export const GlowCanvas: React.FC<GlowCanvasProps> = ({ glow, className, style }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const labelsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const labelHost = labelsRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const isDay = document.documentElement.getAttribute("data-mode") === "day";
        const glowOn = glow ?? !isDay;
        const inkOf = (s: Stroke) => (isDay ? s.dayColor : s.color);

        // Подписи авторов живут в DOM, а не в canvas: так они читаются чётко на любом DPR.
        const labels = new Map<string, HTMLSpanElement>();
        STROKES.forEach(s => {
            if (!s.author || !labelHost) return;
            const el = document.createElement("span");
            el.className = "lb-cursor";
            el.textContent = s.author;
            el.style.position = "absolute";
            el.style.background = inkOf(s);
            el.style.opacity = "0";
            el.style.transform = "translate(8px, -50%)";
            labelHost.appendChild(el);
            labels.set(s.author, el);
        });

        let width = 0, height = 0;
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = rect.width; height = rect.height;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const CYCLE = 9000;   // полный проход: рисуем, держим, гасим
        const DRAW = 0.55;    // доля цикла на прорисовку одного штриха
        let raf = 0;
        const started = performance.now();

        const drawStroke = (s: Stroke, progress: number, fade: number) => {
            if (progress <= 0) return;
            const steps = Math.max(2, Math.round(140 * progress));
            ctx.save();
            ctx.globalAlpha = fade;
            const ink = inkOf(s);
            ctx.strokeStyle = ink;
            ctx.lineWidth = s.width;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            if (glowOn) {
                ctx.shadowColor = ink;
                ctx.shadowBlur = 18;
            }
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const [nx, ny] = pointAt(s.path, (i / steps) * progress);
                const x = nx * width, y = ny * height;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Ведущая точка — «кончик пера»
            const [tx, ty] = pointAt(s.path, progress);
            const px = tx * width, py = ty * height;
            if (progress < 1) {
                ctx.beginPath();
                ctx.fillStyle = ink;
                ctx.arc(px, py, s.width * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            const label = s.author && labels.get(s.author);
            if (label) {
                label.style.left = `${px}px`;
                label.style.top = `${py}px`;
                label.style.opacity = String(progress < 1 ? fade : 0);
            }
        };

        const frame = (now: number) => {
            ctx.clearRect(0, 0, width, height);
            const t = ((now - started) % CYCLE) / CYCLE;

            STROKES.forEach(s => {
                const local = (t - s.delay) / DRAW;
                const progress = Math.max(0, Math.min(1, local));
                // Гаснем в самом конце цикла, чтобы петля не резала глаз
                const fade = t > 0.9 ? 1 - (t - 0.9) / 0.1 : 1;
                drawStroke(s, progress, fade);
            });

            raf = requestAnimationFrame(frame);
        };

        if (reduced) {
            // Без анимации показываем готовый рисунок — он и так говорит о продукте
            ctx.clearRect(0, 0, width, height);
            STROKES.forEach(s => drawStroke(s, 1, 1));
        } else {
            raf = requestAnimationFrame(frame);
        }

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            labels.forEach(el => el.remove());
        };
    }, [glow]);

    return (
        <div className={className} style={{ position: "relative", ...style }}>
            <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
            <div ref={labelsRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        </div>
    );
};
