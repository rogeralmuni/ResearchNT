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
  executive_summary text,
  team_info text,
  pros text,
  cons text,
  pending_points text,
  memo text,
  summary text, -- resumen generado automáticamente por IA
  pending_tasks text, -- documentos, tareas pendientes y puntos por clarificar
  created_at timestamp with time zone default now()
);

-- Documents table (simplified)
create table documents (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  name text,
  type text, -- pitchdeck, plan financiero, etc.
  url text,
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

-- Competitors table
create table competitors (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  competitor_name text not null,
  description text,
  founded_year integer,
  employee_count integer,
  funding_raised numeric,
  revenue numeric,
  linkedin_url text,
  website_url text,
  market_segment text,
  main_features text,
  similarity_score numeric, -- score de similitud con la startup principal
  is_external boolean default true, -- true si es competidor externo, false si está en la plataforma
  external_startup_id uuid references startups(id), -- si está en la plataforma
  research_status text default 'pending', -- pending, researching, completed
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Market analysis table (simplified for OpenAI deep research)
create table market_analysis (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  research_report text, -- The complete market research report from OpenAI
  research_status text default 'pending', -- pending, researching, completed
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Competitors research table (for storing research reports)
create table competitors_research (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  research_report text, -- The complete competitive research report from OpenAI
  research_status text default 'pending', -- pending, researching, completed
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Chat messages for market analysis and competitors
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id),
  tab_type text not null, -- 'market' or 'competitors'
  message_text text not null,
  is_user boolean not null,
  timestamp timestamp with time zone default now()
);

-- Market segments table for better categorization
create table market_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  parent_segment_id uuid references market_segments(id),
  created_at timestamp with time zone default now()
);

-- Startup market segments relationship
create table startup_market_segments (
  startup_id uuid references startups(id),
  segment_id uuid references market_segments(id),
  primary key (startup_id, segment_id)
); 