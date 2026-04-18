const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const registerUnifiedRoutes = require('./backend/unifiedRoutes.js');

dotenv.config();
const app = express();

const parseAllowedOrigins = () => {
  const configuredOrigins = String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultDevOrigins = [
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:5173',
  ];

  return new Set([...defaultDevOrigins, ...configuredOrigins]);
};

const allowedOrigins = parseAllowedOrigins();
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
  credentials: false,
  optionsSuccessStatus: 204,
};

// 1) Middleware for JSON and CORS
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// 2) Your API routes
registerUnifiedRoutes(app);

// ──────────────────────────────────────────────────────
// 3) Serve shared media from the repo root so all apps resolve /assets/*
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 4) Serve the Rooms React build
app.use(express.static(path.join(__dirname, 'apps/rooms/build')));
// ──────────────────────────────────────────────────────

// 5) Rooms SPA under /rooms
app.use('/rooms', express.static(path.join(__dirname, 'apps/rooms/build')));
app.get('/rooms/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/rooms/build', 'index.html'));
});

// 6) Threads SPA under /threads
app.use('/threads', express.static(path.join(__dirname, 'apps/threads/dist')));
app.get('/threads/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/threads/dist', 'index.html'));
});

// 7) Timeline SPA under /timeline
app.use('/timeline', express.static(path.join(__dirname, 'apps/timeline/dist')));
app.get('/timeline/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/timeline/dist', 'index.html'));
});

// 8) Root investor portal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 9) Health check
app.get('/health', (req, res) => res.sendStatus(200));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`✅ Unified backend running on port ${PORT}`)
);
