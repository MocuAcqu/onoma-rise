const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const { createApp } = require('./src/app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';

async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error('缺少必要環境變數 MONGO_URI');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    // Avoid Mongoose silently choosing `test` when the URI has no db path.
    dbName: process.env.MONGO_DATABASE || undefined,
  });
  console.log('MongoDB Connected!');
  const app = createApp();
  app.listen(PORT, HOST, () => console.log(`Server started at http://${HOST}:${PORT}`));
}

start().catch(error => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
