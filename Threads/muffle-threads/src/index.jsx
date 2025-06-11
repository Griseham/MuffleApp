// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './tailwind.css';

import App from './App';
import './index.css'; // (optional global resets or styles)

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
