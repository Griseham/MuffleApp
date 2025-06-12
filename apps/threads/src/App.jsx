// src/App.js
import React from 'react';
import Home from './pages/Home';
import { GlobalModalProvider } from './components/context/GlobalModalContext';
import './App.css';
import './index.css';

function App() {
  return (
    <GlobalModalProvider>
      <div className="App">
       
        <main>
      
          <Home />

        </main>
      </div>
    </GlobalModalProvider>
  );
}

export default App;
