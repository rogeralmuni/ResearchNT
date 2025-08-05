const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'startups.db');

console.log('🔄 Migrating database schema...');

try {
  const db = new Database(dbPath);

  // Drop and recreate market_analysis table with new structure
  console.log('📊 Updating market_analysis table...');
  
  // Drop the old table
  db.prepare('DROP TABLE IF EXISTS market_analysis').run();
  
  // Create the new simplified table
  db.prepare(`
    CREATE TABLE market_analysis (
      startup_id TEXT PRIMARY KEY,
      research_report TEXT,
      research_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (startup_id) REFERENCES startups (id)
    )
  `).run();

  console.log('✅ Market analysis table migrated successfully!');
  
  // Check table structure
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name IN ('startups', 'competitors', 'market_analysis', 'chat_messages', 'documents', 'metrics')
  `).all();
  
  console.log('📋 Available tables:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get().count;
    console.log(`- ${table.name}: ${count} records`);
  });

  db.close();
  console.log('🎉 Database migration completed successfully!');

} catch (error) {
  console.error('❌ Error during migration:', error);
  process.exit(1);
} 