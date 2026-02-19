-- Marxapp v0.1 minimal schema

create table if not exists dataset_registry (
  id text primary key,
  source text not null,
  license text,
  last_updated date,
  coverage text not null,
  metric_definitions jsonb not null,
  default_confidence text not null check (default_confidence in ('high','medium','low')),
  created_at timestamptz not null default now()
);

create table if not exists dataset_snapshot (
  id text primary key,
  dataset_id text not null references dataset_registry(id),
  snapshot_hash text not null,
  manifest jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists dataset_snapshot_active_uniq
  on dataset_snapshot (dataset_id)
  where active = true;

create table if not exists indicator_country_year (
  dataset_snapshot_id text not null references dataset_snapshot(id),
  country_iso3 char(3) not null,
  year int not null,
  domain text not null,
  metric_id text not null,
  value numeric not null,
  unit text not null,
  confidence text not null check (confidence in ('high','medium','low')),
  source_note text,
  primary key (dataset_snapshot_id, country_iso3, year, metric_id)
);

create table if not exists assumptions_snapshot (
  id text primary key,
  model_version text not null,
  assumptions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists scenario_run (
  id text primary key,
  scenario_hash text not null,
  model_version text not null,
  dataset_snapshot_id text not null references dataset_snapshot(id),
  assumptions_snapshot_id text not null references assumptions_snapshot(id),
  scenario_config jsonb not null,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists scenario_run_hash_idx on scenario_run (scenario_hash);
