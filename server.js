const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const registerUnifiedRoutes = require('./backend/unifiedRoutes.js');

dotenv.config();
const app = express();

// 1) JSON + CORS
app.use(cors());
app.use(express.json());

// 2) Your API routes
registerUnifiedRoutes(app);


// 4) Rooms SPA at /rooms
app.use('/rooms', express.static(path.join(__dirname, 'apps/mufl/build')));
app.get('/rooms/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/mufl/build', 'index.html'));
});

// 5) Threads SPA at /threads
app.use('/threads', express.static(path.join(__dirname, 'apps/threads/dist')));
app.get('/threads/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/threads/dist', 'index.html'));
});

// 6) Root investor portal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 7) Health check
app.get('/health', (req, res) => res.sendStatus(200));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`✅ Unified backend running`)
);
