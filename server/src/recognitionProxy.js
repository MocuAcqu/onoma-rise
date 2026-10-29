const http = require('node:http');
const https = require('node:https');

const RECOGNITION_PATHS = [
  '/api/jobs',
  '/api/audio',
  '/api/health/recognition',
];

function isRecognitionPath(pathname) {
  return RECOGNITION_PATHS.some(prefix => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
}

function createRecognitionProxy(env = process.env) {
  const target = env.RECOGNITION_API_URL?.trim();
  if (!target) return null;

  const token = env.RECOGNITION_PROXY_TOKEN?.trim();
  if (!token || token.length < 32) {
    throw new Error(
      '設定 RECOGNITION_API_URL 時，也必須設定至少 32 字元的 RECOGNITION_PROXY_TOKEN',
    );
  }

  const upstream = new URL(target);
  if (!['http:', 'https:'].includes(upstream.protocol)) {
    throw new Error('RECOGNITION_API_URL 僅支援 http:// 或 https://');
  }
  const transport = upstream.protocol === 'https:' ? https : http;
  const basePath = upstream.pathname.replace(/\/$/, '');

  return function recognitionProxy(req, res) {
    const forwardedFor = [req.headers['x-forwarded-for'], req.socket.remoteAddress]
      .filter(Boolean)
      .join(', ');
    const headers = {
      ...req.headers,
      host: upstream.host,
      'x-forwarded-for': forwardedFor,
      'x-forwarded-proto': req.protocol,
      'x-recognition-token': token,
    };
    if (req.headers.host) headers['x-forwarded-host'] = req.headers.host;

    const proxyRequest = transport.request({
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: upstream.port || undefined,
      method: req.method,
      path: `${basePath}${req.originalUrl}`,
      headers,
      timeout: 660_000,
    }, proxyResponse => {
      res.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.on('error', error => res.destroy(error));
      proxyResponse.pipe(res);
    });

    proxyRequest.on('timeout', () => {
      proxyRequest.destroy(new Error('Recognition upstream timed out'));
    });
    proxyRequest.on('error', error => {
      console.error('Recognition proxy failed:', error.message);
      if (res.writableEnded) return;
      if (res.headersSent) {
        res.destroy(error);
        return;
      }
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '辨識服務目前無法連線，請稍後再試。' }));
    });
    req.on('aborted', () => proxyRequest.destroy());
    req.pipe(proxyRequest);
  };
}

module.exports = { createRecognitionProxy, isRecognitionPath };
