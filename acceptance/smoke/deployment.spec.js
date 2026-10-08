/**
 * Deployment smoke tests: fast, read-only checks that a freshly deployed release
 * is alive and is the expected version. Safe to run against production.
 *
 *   BASE_URL=https://reviews.example EXPECTED_VERSION=<git sha> npm run test:smoke
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { config } from '../config.js';

describe('Deployment smoke test', () => {
  it('is healthy and running the expected version', async () => {
    const res = await fetch(`${config.baseUrl}/healthz`);
    assert.equal(res.status, 200);
    const health = await res.json();
    assert.equal(health.status, 'ok');
    if (process.env.EXPECTED_VERSION) assert.equal(health.version, process.env.EXPECTED_VERSION);
  });

  it('serves the embed script to other origins', async () => {
    const res = await fetch(`${config.baseUrl}/widget.js`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
    assert.match(await res.text(), /ReviewWidget/);
  });

  it('serves the agency dashboard', async () => {
    const res = await fetch(`${config.baseUrl}/admin/`);
    assert.equal(res.status, 200);
  });
});
