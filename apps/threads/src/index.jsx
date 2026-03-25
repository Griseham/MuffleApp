// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './tailwind.css';

import App from './App';
import './index.css'; // (optional global resets or styles)

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
