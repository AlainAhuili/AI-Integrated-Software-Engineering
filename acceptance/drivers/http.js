import { config } from '../config.js';

/** Minimal HTTP helper shared by the API drivers. Never follows redirects. */
export async function request(path, { key, method = 'GET', body, baseUrl = config.baseUrl } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response (redirects, HTML); callers use status/headers instead.
  }
  return { status: res.status, headers: res.headers, json };
}

export async function expectStatus(promise, expected, action) {
  const res = await promise;
  if (res.status !== expected) {
    throw new Error(`${action} failed: expected HTTP ${expected}, got ${res.status} ${JSON.stringify(res.json)}`);
  }
  return res;
}
