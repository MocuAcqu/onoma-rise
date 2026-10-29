const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./features/auth');
const chapterRoutes = require('./features/chapters');
const userRoutes = require('./features/users');
const { createRecognitionProxy, isRecognitionPath } = require('./recognitionProxy');

const DEFAULT_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173';

function corsOrigins() {
  return (process.env.CORS_ORIGINS || DEFAULT_ORIGINS)
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function createApp() {
  const app = express();

  app.use(cors({ origin: corsOrigins() }));

  // Proxy multipart bodies before express.json() reads the request stream.
  const recognitionProxy = createRecognitionProxy();
  if (recognitionProxy) {
    app.use((req, res, next) => (
      isRecognitionPath(req.path) ? recognitionProxy(req, res, next) : next()
    ));
  }

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    res.status(databaseReady ? 200 : 503).json({
      api: true,
      database: databaseReady,
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/chapters', chapterRoutes);
  app.use('/api/user', userRoutes);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).send('Server Error');
  });

  return app;
}

module.exports = { createApp };
