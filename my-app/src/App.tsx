import * as React from 'react';
import './App.css';
import styled, { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme, BoardTheme } from './types/theme';
import { useEffect } from "react";
import { DrawPage } from "./Pages/DrawPage";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { StartPage } from "./Pages/StartPage";
import { Provider } from "react-redux";
import { store } from "./Store/Store";

declare module 'styled-components' {
    export interface DefaultTheme extends BoardTheme {}
}

const Container = styled.div`
    background-color: ${(props) => props.theme.bg};
    color: ${(props) => props.theme.text};
    min-height: 100vh;
    transition: background 0.4s ease-in-out;
`;

// Хеш-роутинг: сборка выкладывается на статику (GitHub Pages),
// где сервер не умеет отдавать index.html на произвольный путь.
function App() {
    // «Световая доска» — тёмная по замыслу: день включается только явным выбором
    const [isDark, setIsDark] = React.useState(localStorage.getItem('theme') !== 'light');

    useEffect(() => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        // Режим живёт на <html>: CSS-переменные светятся ночью и гаснут днём.
        document.documentElement.setAttribute('data-mode', isDark ? 'night' : 'day');
    }, [isDark]);

    return (
        <Provider store={store}>
            <Router>
                <Routes>
                    <Route path="/Draw/:roomId" element={<div><ThemeProvider theme={isDark ? darkTheme : lightTheme}>
                        <Container>
                            <DrawPage setIsDark={setIsDark}></DrawPage>
                        </Container>
                    </ThemeProvider></div>}></Route>
                    <Route path="/Draw" element={<div><ThemeProvider theme={isDark ? darkTheme : lightTheme}>
                        <Container>
                            <DrawPage setIsDark={setIsDark}></DrawPage>
                        </Container>
                    </ThemeProvider></div>}></Route>
                    <Route path="/" element={<StartPage />}></Route>
                </Routes>
            </Router>
        </Provider>
    );
}

export default App;