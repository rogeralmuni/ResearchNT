import Database from 'better-sqlite3';
import path from 'path';

// Database connection
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'startups.db');
    db = new Database(dbPath);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function initializeDatabase(): void {
  console.log('✅ Database connection initialized');
}

export function getStartupById(id: string): Startup | null {
  const db = getDatabase();
  const startup = db.prepare('SELECT * FROM startups WHERE id = ?').get(id) as Startup | undefined;
  return startup || null;
}

// TypeScript interfaces
export interface Startup {
  id: string;
  name: string;
  description?: string;
  sector?: string;
  stage?: string;
  country?: string;
  team_info?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface Competitor {
  id: string;
  startup_id: string;
  competitor_name: string;
  description?: string;
  founded_year?: number;
  employee_count?: number;
  funding_raised?: number;
  revenue?: number;
  linkedin_url?: string;
  website_url?: string;
  main_features?: string;
  similarity_score: number;
  is_external: boolean;
  research_status: string;
  created_at: string;
  updated_at: string;
}

export interface MarketAnalysis {
  startup_id: string;
  market_size?: number;
  market_size_currency: string;
  market_growth_rate?: number;
  target_segments?: string;
  geographic_regions?: string;
  key_market_trends?: string;
  regulatory_environment?: string;
  competitive_landscape?: string;
  market_opportunities?: string;
  market_risks?: string;
  research_status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  startup_id: string;
  tab_type: 'market' | 'competitors';
  message_text: string;
  is_user: boolean;
  timestamp: string;
}

export interface Document {
  id: string;
  startup_id: string;
  name: string;
  type?: string;
  summary?: string;
  kpis?: string;
  red_flags?: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  startup_id: string;
  arr?: number;
  mrr?: number;
  cac?: number;
  ltv?: number;
  churn?: number;
  runway?: number;
  burn_rate?: number;
  customer_count?: number;
  revenue_growth?: number;
  created_at: string;
  updated_at: string;
} 