import { open } from 'lmdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(path.dirname(__dirname), 'data', 'lmdb');

console.log('Opening database at:', dbPath);
const rootDb = open({ path: dbPath, encoding: 'msgpack' });

// Open positions database
const positionsDb = rootDb.openDB({ name: 'positions', encoding: 'json' });

console.log('\n=== Cleaning Positions Database ===\n');

try {
  // Clear all positions
  await positionsDb.clearAsync();
  console.log('✅ Positions database cleared successfully!');
} catch (error) {
  console.error('Error cleaning positions:', error);
}

rootDb.close();
