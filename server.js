const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const registerRoomsRoutes = require('./Rooms/Mufl/src/backend/index.js');
const registerThreadsRoutes = require('./threadsRoutes.cjs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Register routes
registerRoomsRoutes(app);

// Register Threads routes asynchronously
registerThreadsRoutes(app).then(() => {
  // Serve static files from React builds with proper asset routing
  const roomsBuild = path.join(__dirname, 'Rooms/Mufl/build');
  const threadsBuild = path.join(__dirname, 'Threads/muffle-threads/dist');
  
  app.use('/rooms', express.static(roomsBuild));
  app.use('/threads', express.static(threadsBuild));

  // Health check route
  app.get('/health', (req, res) => {
    res.sendStatus(200);
  });

  // Root route
  app.get('/', (req, res) => {
    res.send(`
      <h1>Muffle Backend ✅</h1>
      <p>Backend is running successfully!</p>
      <ul>
        <li><a href="/rooms">Rooms App</a></li>
        <li><a href="/threads">Threads App</a></li>
        <li><a href="/api/rooms/api/health-check">Rooms API Health</a></li>
        <li><a href="/api/threads/posts">Threads API</a></li>
      </ul>
    `);
  });

  // Serve React apps for SPA routing
  app.get('/rooms/*', (req, res) => {
    res.sendFile(path.join(roomsBuild, 'index.html'));
  });

  app.get('/threads/*', (req, res) => {
    res.sendFile(path.join(threadsBuild, 'index.html'));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified backend running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
