import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// Новая версия должна применяться сразу: иначе вернувшийся посетитель
// продолжает видеть старую сборку, пока не закроет все вкладки.
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    if (!registration.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    registration.waiting.addEventListener('statechange', (event) => {
      if ((event.target as ServiceWorker).state === 'activated') {
        window.location.reload();
      }
    });
  },
});
