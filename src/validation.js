export const LAYOUTS = ['grid', 'carousel', 'list', 'badge'];
export const THEMES = ['light', 'dark', 'auto'];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export class ValidationError extends Error {}

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function str(value, field, max) {
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new ValidationError(`${field} must be at most ${max} characters`);
  return trimmed;
}

function url(value, field) {
  const v = str(value, field, 2000);
  if (v && !isHttpUrl(v)) throw new ValidationError(`${field} must be an http(s) URL`);
  return v;
}

function color(value, field) {
  const v = str(value, field, 7);
  if (v && !HEX_COLOR.test(v)) throw new ValidationError(`${field} must be a hex color like #1a73e8`);
  return v.toLowerCase();
}

function int(value, field, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ValidationError(`${field} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function oneOf(value, field, options) {
  if (!options.includes(value)) throw new ValidationError(`${field} must be one of: ${options.join(', ')}`);
  return value;
}

function bool(value, field) {
  if (typeof value !== 'boolean') throw new ValidationError(`${field} must be true or false`);
  return value;
}

const WIDGET_FIELDS = {
  name: (v) => str(v, 'name', 100),
  placeId: (v) => {
    const id = str(v, 'placeId', 300);
    if (!id) throw new ValidationError('placeId is required');
    return id;
  },
  layout: (v) => oneOf(v, 'layout', LAYOUTS),
  theme: (v) => oneOf(v, 'theme', THEMES),
  accentColor: (v) => color(v, 'accentColor'),
  minRating: (v) => int(v, 'minRating', 1, 5),
  maxReviews: (v) => int(v, 'maxReviews', 1, 5),
  showReviewButton: (v) => bool(v, 'showReviewButton'),
};

export const WIDGET_DEFAULTS = Object.freeze({
  name: '',
  layout: 'grid',
  theme: 'light',
  accentColor: '',
  minRating: 4,
  maxReviews: 5,
  showReviewButton: true,
});

const BRANDING_FIELDS = {
  brandName: (v) => str(v, 'brandName', 100),
  logoUrl: (v) => url(v, 'logoUrl'),
  primaryColor: (v) => {
    const c = color(v, 'primaryColor');
    if (!c) throw new ValidationError('primaryColor is required');
    return c;
  },
  poweredByText: (v) => str(v, 'poweredByText', 100),
  poweredByUrl: (v) => url(v, 'poweredByUrl'),
  hidePoweredBy: (v) => bool(v, 'hidePoweredBy'),
};

function pick(input, validators) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Request body must be a JSON object');
  }
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (!(key in validators)) throw new ValidationError(`Unknown field: ${key}`);
    out[key] = validators[key](value);
  }
  return out;
}

/** Validates a widget create (all fields, defaults applied) or update (partial). */
export function validateWidget(input, { partial = false } = {}) {
  const fields = pick(input, WIDGET_FIELDS);
  if (partial) return fields;
  if (!('placeId' in fields)) throw new ValidationError('placeId is required');
  return { ...WIDGET_DEFAULTS, ...fields };
}

export function validateBranding(input) {
  return pick(input, BRANDING_FIELDS);
}
