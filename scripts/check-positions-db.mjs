import { open } from 'lmdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(path.dirname(__dirname), 'data', 'lmdb');

console.log('Opening database at:', dbPath);
const rootDb = open({ path: dbPath });

// Open positions database
const positionsDb = rootDb.openDB({ name: 'positions' });

console.log('\n=== Checking Positions Database ===\n');

try {
  const range = positionsDb.getRange();

  let count = 0;
  for (const { key, value } of range) {
    count++;
    console.log(`ID: ${key}`);
    console.log(`Value:`, value);
    console.log('---');
  }
  
  console.log(`\nTotal positions in database: ${count}`);
} catch (error) {
  console.error('Error reading positions:', error);
}

rootDb.close();
