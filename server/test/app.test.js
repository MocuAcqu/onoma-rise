const assert = require('node:assert/strict');
const test = require('node:test');

const { createApp } = require('../src/app');

test('app mounts health and feature routes', () => {
  const app = createApp();
  const stack = app.router.stack;

  assert.ok(stack.some(layer => layer.route?.path === '/api/health'));
  assert.equal(stack.filter(layer => layer.name === 'router').length, 3);
});
