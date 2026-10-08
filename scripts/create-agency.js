import { loadConfig } from '../src/config.js';
import { Store } from '../src/store.js';

const name = process.argv.slice(2).join(' ').trim();
if (!name) {
  console.error('Usage: npm run create-agency -- "Agency Name"');
  process.exit(1);
}

const store = new Store(loadConfig().dataFile);
const { agency, apiKey } = store.createAgency(name);
console.log(`Created agency "${agency.name}" (${agency.id})`);
console.log(`Admin API key (shown only once): ${apiKey}`);
console.log('Restart the server if it is running so it picks up the new agency.');
