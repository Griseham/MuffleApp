const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const registerUnifiedRoutes = require('./backend/unifiedRoutes.js');

dotenv.config();
const app = express();

// 1) Middleware for JSON and CORS
app.use(cors());
app.use(express.json());

// 2) Your API routes
registerUnifiedRoutes(app);

// ──────────────────────────────────────────────────────
// 3) Serve shared media from the repo root so all apps resolve /assets/*
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 4) Serve the Mufl React build
app.use(express.static(path.join(__dirname, 'apps/mufl/build')));
// ──────────────────────────────────────────────────────

// 5) Rooms SPA under /rooms
app.use('/rooms', express.static(path.join(__dirname, 'apps/mufl/build')));
app.get('/rooms/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/mufl/build', 'index.html'));
});

// 6) Threads SPA under /threads
app.use('/threads', express.static(path.join(__dirname, 'apps/threads/dist')));
app.get('/threads/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/threads/dist', 'index.html'));
});

// 7) Root investor portal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 8) Health check
app.get('/health', (req, res) => res.sendStatus(200));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`✅ Unified backend running on port ${PORT}`)
);
