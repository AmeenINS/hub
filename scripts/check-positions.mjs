import { open } from 'lmdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(path.dirname(__dirname), 'data', 'lmdb');

console.log('Opening database at:', dbPath);
const db = open({ path: dbPath });

console.log('\n=== Checking Position entries ===\n');

try {
  const range = db.getRange({ 
    start: 'position:', 
    end: 'position:\xFF' 
  });

  let count = 0;
  for (const { key, value } of range) {
    count++;
    console.log(`Key: ${key}`);
    console.log(`Value:`, value);
    console.log('---');
  }
  
  console.log(`\nTotal positions found: ${count}`);
} catch (error) {
  console.error('Error reading positions:', error);
}

db.close();
