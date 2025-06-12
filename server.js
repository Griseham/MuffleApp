const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
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
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified backend running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
