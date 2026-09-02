// Палитра «Световой доски»: ночной режим со свечением и дневной по светлой бумаге.
// Значения совпадают с CSS-переменными в styles/lightboard.css — Konva читает их отсюда,
// потому что рисует в canvas и до CSS-переменных не дотягивается.

export interface BoardTheme {
    mode: 'night' | 'day';
    bg: string;
    text: string;
    surface: string;
    line: string;
    dim: string;
    /** Цвета участников: ими же красятся штрихи и курсоры. */
    inks: string[];
    /** Насколько сильно светятся штрихи (радиус тени Konva). */
    glow: number;
}

export const darkTheme: BoardTheme = {
    mode: 'night',
    bg: '#07070a',
    text: '#f0f0f5',
    surface: 'rgba(255,255,255,0.035)',
    line: 'rgba(255,255,255,0.09)',
    dim: '#9a9aab',
    inks: ['#5eead4', '#a78bfa', '#d946ef', '#fbbf24', '#fb7185', '#f0f0f5'],
    glow: 14,
};

export const lightTheme: BoardTheme = {
    mode: 'day',
    bg: '#f4f4f7',
    text: '#14141b',
    surface: 'rgba(10,10,18,0.035)',
    line: 'rgba(10,10,18,0.11)',
    dim: '#545465',
    inks: ['#0d9488', '#7c3aed', '#c026d3', '#b45309', '#e11d48', '#14141b'],
    glow: 0,
};
