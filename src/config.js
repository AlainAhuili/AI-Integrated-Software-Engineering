export function loadConfig(env = process.env) {
  const port = Number(env.PORT) || 3000;
  return {
    port,
    publicUrl: (env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
    googleApiKey: env.GOOGLE_PLACES_API_KEY || '',
    googlePlacesBaseUrl: env.GOOGLE_PLACES_BASE_URL || 'https://places.googleapis.com/v1',
    operatorApiKey: env.OPERATOR_API_KEY || '',
    version: env.APP_VERSION || 'dev',
    cacheTtlSeconds: Number(env.CACHE_TTL_SECONDS) || 3600,
    dataFile: env.DATA_FILE || 'data/db.json',
  };
}
