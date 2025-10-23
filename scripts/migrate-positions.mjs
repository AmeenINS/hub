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

console.log('\n=== Migrating Positions ===\n');

try {
  // Read old positions with 'position:' prefix
  const oldRange = rootDb.getRange({ 
    start: 'position:', 
    end: 'position;\xFF'
  });

  let count = 0;
  for (const { key, value } of oldRange) {
    if (typeof key === 'string' && key.startsWith('position:')) {
      const id = key.replace('position:', '');
      console.log(`Migrating ${key} -> ${id}`);
      
      // Write to new positions database
      await positionsDb.put(id, value);
      
      // Delete old entry
      await rootDb.remove(key);
      
      count++;
    }
  }
  
  console.log(`\nMigrated ${count} positions successfully!`);
} catch (error) {
  console.error('Error migrating positions:', error);
}

rootDb.close();
