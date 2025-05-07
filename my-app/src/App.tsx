import * as React from 'react';
import './App.css';
import styled, { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './types/theme';
import {useEffect, useState} from "react";
import Pen from "./sourses/Pen";
import {DrawPage} from "./Pages/DrawPage";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import {StartPage} from "./Pages/StartPage";
import {Provider} from "react-redux";
import {store} from "./Store/Store";

// import 'canvas'
declare module 'styled-components' {
  export interface DefaultTheme {
    bg: string;
    text: string;
  }
}

const Container = styled.div`
    background-color: ${(props) => props.theme.bg};
    color: ${(props) => props.theme.text};
    min-height: 100vh;
    transition: background 0.4s ease-in-out;
`;

function App() {
  const [isDark, setIsDark] = React.useState(localStorage.getItem('theme') === 'dark'   );

    useEffect(() => {
        isDark ? localStorage.setItem('theme','dark') : localStorage.setItem('theme','light')
    }, [isDark]);

    return (
        <Provider store={store}>
        <Router>
            <Routes>
                <Route path="/Draw" element={<div><ThemeProvider theme={isDark ? darkTheme : lightTheme}>
                    <Container>
                        <DrawPage setIsDark={setIsDark}></DrawPage>
                    </Container>
                </ThemeProvider></div>}></Route>
                <Route path="/" element={<StartPage/>}></Route>
            </Routes>
        </Router>
        </Provider>
    );
}

export default App;