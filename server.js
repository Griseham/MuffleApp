const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const registerUnifiedRoutes = require('./backend/unifiedRoutes.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Register unified routes
registerUnifiedRoutes(app);

// Serve static files from React builds
const roomsBuild = path.join(__dirname, 'apps/mufl/build');
const threadsBuild = path.join(__dirname, 'apps/threads/dist');

// Serve static assets for root page
app.use('/assets', express.static(path.join(__dirname, 'shared/assets')));

// Rooms app
app.use('/rooms', express.static(roomsBuild));
app.get('/rooms/*', (req, res) => {
  res.sendFile(path.join(roomsBuild, 'index.html'));
});

// Threads app  
app.use('/threads', express.static(threadsBuild));
app.get('/threads/*', (req, res) => {
  res.sendFile(path.join(threadsBuild, 'index.html'));
});

// Health check route
app.get('/health', (req, res) => {
  res.sendStatus(200);
});

// Root route - serve investor portal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
