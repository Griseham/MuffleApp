// CommonJS wrapper for ES module Threads backend
module.exports = async function registerThreadsRoutes(app) {
  try {
    const { default: registerThreadsRoutesES } = await import('./Threads/muffle-threads/src/backend/server.js');
    registerThreadsRoutesES(app);
  } catch (error) {
    console.error('Failed to load Threads routes:', error);
    // Create a simple fallback router
    const express = require('express');
    const threadsRouter = express.Router();
    threadsRouter.get('/health', (req, res) => {
      res.json({ status: 'Threads module failed to load', error: error.message });
    });
    app.use('/api/threads', threadsRouter);
  }
};