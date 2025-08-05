const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dataDir, 'startups.db');
const db = new Database(dbPath);

console.log('🚀 Setting up database schema...');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS startups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sector TEXT,
    stage TEXT,
    country TEXT,
    team_info TEXT,
    memo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    startup_id TEXT NOT NULL,
    competitor_name TEXT NOT NULL,
    description TEXT,
    founded_year INTEGER,
    employee_count INTEGER,
    funding_raised REAL,
    revenue REAL,
    linkedin_url TEXT,
    website_url TEXT,
    main_features TEXT,
    similarity_score REAL DEFAULT 0.0,
    is_external BOOLEAN DEFAULT 1,
    research_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups (id)
  );

  CREATE TABLE IF NOT EXISTS metrics (
    startup_id TEXT PRIMARY KEY,
    arr REAL,
    mrr REAL,
    cac REAL,
    ltv REAL,
    churn REAL,
    runway INTEGER,
    burn_rate REAL,
    customer_count INTEGER,
    revenue_growth REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups (id)
  );

  CREATE TABLE IF NOT EXISTS market_analysis (
    startup_id TEXT PRIMARY KEY,
    research_report TEXT,
    research_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups (id)
  );

  CREATE TABLE IF NOT EXISTS competitors_research (
    startup_id TEXT PRIMARY KEY,
    research_report TEXT,
    research_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups (id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    startup_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    summary TEXT,
    kpis TEXT,
    red_flags TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups (id)
  );
`);

console.log('✅ Database schema created successfully!');
console.log('📊 Tables created:');
console.log('- startups');
console.log('- competitors');
console.log('- metrics');
console.log('- market_analysis');
console.log('- competitors_research');
console.log('- documents');

// Close database connection
db.close(); 