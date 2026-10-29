const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const express = require('express');

const { createRecognitionProxy, isRecognitionPath } = require('../src/recognitionProxy');

test('recognition path matcher only selects Python API routes', () => {
  assert.equal(isRecognitionPath('/api/jobs'), true);
  assert.equal(isRecognitionPath('/api/jobs/123/notation'), true);
  assert.equal(isRecognitionPath('/api/audio/transcribe'), true);
  assert.equal(isRecognitionPath('/api/health/recognition'), true);
  assert.equal(isRecognitionPath('/api/auth/login'), false);
  assert.equal(isRecognitionPath('/api/jobshop'), false);
});

test('recognition proxy stays disabled when no target is configured', () => {
  assert.equal(createRecognitionProxy({}), null);
});

test('recognition proxy requires a shared token', () => {
  assert.throws(
    () => createRecognitionProxy({ RECOGNITION_API_URL: 'http://example.test' }),
    /RECOGNITION_PROXY_TOKEN/,
  );
  assert.throws(
    () => createRecognitionProxy({
      RECOGNITION_API_URL: 'http://example.test',
      RECOGNITION_PROXY_TOKEN: 'too-short',
    }),
    /至少 32 字元/,
  );
});

test('recognition proxy streams the original request and adds its server-only token', async t => {
  let received;
  const upstream = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      received = {
        body: Buffer.concat(chunks).toString(),
        token: req.headers['x-recognition-token'],
        url: req.url,
      };
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end('{"proxied":true}');
    });
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  t.after(() => upstream.close());

  const app = express();
  app.use(createRecognitionProxy({
    RECOGNITION_API_URL: `http://127.0.0.1:${upstream.address().port}`,
    RECOGNITION_PROXY_TOKEN: 'server-only-secret-with-32-characters',
  }));
  const gateway = app.listen(0, '127.0.0.1');
  await new Promise(resolve => gateway.once('listening', resolve));
  t.after(() => gateway.close());

  const response = await fetch(
    `http://127.0.0.1:${gateway.address().port}/api/audio/transcribe?mode=test`,
    { method: 'POST', body: 'audio-bytes' },
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { proxied: true });
  assert.deepEqual(received, {
    body: 'audio-bytes',
    token: 'server-only-secret-with-32-characters',
    url: '/api/audio/transcribe?mode=test',
  });
});
