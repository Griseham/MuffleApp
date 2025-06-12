const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const registerRoomsRoutes = require('./Rooms/Mufl/src/backend/index.js');
const registerThreadsRoutes = require('./Threads/muffle-threads/src/backend/server.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

registerRoomsRoutes(app);
registerThreadsRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Unified backend running on port ${PORT}`);
});
