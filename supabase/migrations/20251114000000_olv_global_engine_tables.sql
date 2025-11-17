-- OLV GLOBAL ENGINE - Novas tabelas base para tenants internacionais
-- Executar no Supabase SQL editor

create table if not exists public.tenant_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  languages text[] default array[]::text[],
  contact_person jsonb,
  product_strategy jsonb,
  target_markets jsonb,
  fit_rules jsonb,
  search_keywords_positive text[] default array[]::text[],
  search_keywords_negative text[] default array[]::text[],
  minimum_dealer_size jsonb,
  trading_budget jsonb,
  intelligence_level text default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenant_profiles(id) on delete cascade,
  product_name text not null,
  hs_code text not null,
  category text,
  fob_price_min numeric,
  fob_price_max numeric,
  min_order_quantity integer,
  certifications text[] default array[]::text[],
  description text,
  differentiators text[] default array[]::text[],
  keywords text[] default array[]::text[],
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.global_companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenant_profiles(id) on delete cascade,
  company_name text not null,
  domain text,
  country text,
  city text,
  industry text,
  company_type text,
  employee_band text,
  revenue_band text,
  digital_presence_score numeric,
  fit_score numeric,
  import_history jsonb,
  decision_makers jsonb,
  sources jsonb,
  enrichment_stage text default 'discovery',
  status text default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.global_enrichment_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.global_companies(id) on delete cascade,
  stage text not null,
  status text not null,
  source text,
  payload jsonb,
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists public.global_trade_data (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.global_companies(id) on delete cascade,
  hs_code text,
  description text,
  origin_country text,
  destination_country text,
  shipment_date date,
  quantity numeric,
  quantity_unit text,
  value_usd numeric,
  port_of_loading text,
  port_of_discharge text,
  carrier text,
  source text,
  confidence_score numeric,
  raw_record jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.global_insights (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.global_companies(id) on delete cascade,
  insight_type text,
  summary text,
  confidence_score numeric,
  source_url text,
  detected_at timestamptz default now(),
  metadata jsonb
);

comment on table public.tenant_profiles is 'Perfil de cada exportador (tenant) com estratégia internacional';
comment on table public.tenant_products is 'Produtos do tenant com HS Code obrigatório para busca global';
comment on table public.global_companies is 'Empresas alvo internacionais (dealers, importadores, distribuidores)';
comment on table public.global_trade_data is 'Dados de import/export vindos de ImportGenius/Panjiva e outras fontes';
comment on table public.global_insights is 'Insights detectados pelo Global Intelligence Engine';


