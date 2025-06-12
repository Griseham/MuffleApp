import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import registerRoomsRoutes from './Rooms/Mufl/src/backend/index.js';
import registerThreadsRoutes from './Threads/muffle-threads/src/backend/server.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

registerRoomsRoutes(app);
registerThreadsRoutes(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified backend running on port ${PORT}`);
  });
  
