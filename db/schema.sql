-- Startups table
create table startups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  stage text,
  country text,
  description text,
  website text,
  status text, -- en análisis, invertida, descartada
  created_at timestamp with time zone default now()
);

-- Documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  name text,
  type text, -- pitchdeck, plan financiero, etc.
  url text,
  summary text,
  kpis jsonb,
  red_flags text,
  uploaded_at timestamp with time zone default now()
);

-- Metrics table
create table metrics (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  arr numeric,
  mrr numeric,
  cac numeric,
  ltv numeric,
  churn numeric,
  runway numeric,
  updated_at timestamp with time zone default now()
);

-- Notes table
create table notes (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  content text,
  created_at timestamp with time zone default now()
);

-- Users table (optional, for future auth)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamp with time zone default now()
);

-- Analysis History table for continuous and iterative analysis
create table analysis_history (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  analysis_type text not null, -- 'investment', 'market_research', 'chat'
  content text not null,
  trigger text default 'manual', -- 'manual', 'document_upload', 'metrics_update', 'note_added'
  created_at timestamp with time zone default now()
);

-- Add embedding column to documents table for vector search
alter table documents add column embedding vector(1536); 