-- Corre esto en el SQL Editor de tu proyecto de Supabase (una sola vez)

create table if not exists progress (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table progress enable row level security;

create policy "Cada usuario ve solo su progreso"
  on progress for select
  using (auth.uid() = user_id);

create policy "Cada usuario inserta solo su progreso"
  on progress for insert
  with check (auth.uid() = user_id);

create policy "Cada usuario actualiza solo su progreso"
  on progress for update
  using (auth.uid() = user_id);

-- Tabla de suscripciones (Stripe). Solo el webhook (con la service role key)
-- puede escribir aquí; los usuarios solo pueden leer su propia fila.
create table if not exists subscriptions (
  user_id uuid references auth.users(id) on delete cascade primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  plan text, -- "monthly" | "annual" | null (null = sin dato, ej. suscripciones de antes de este cambio)
  updated_at timestamptz not null default now()
);

-- 29 de octubre de 2026 — Fase 1 del sistema de planes Gratis/Plus: la
-- tabla ya existía desde el lanzamiento de Stripe, así que "create table if
-- not exists" de arriba no le agrega la columna nueva a una base de datos
-- que ya la tenía creada. Esta línea sí la agrega, sin tocar ninguna fila
-- existente (las suscripciones de antes de hoy quedan con plan = NULL,
-- que la app muestra simplemente como "Plan Plus" sin precisar mensual o
-- anual, hasta que esa suscripción tenga su próximo evento de Stripe).
alter table subscriptions add column if not exists plan text;

alter table subscriptions enable row level security;

create policy "Cada usuario ve solo su suscripción"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Suscripciones de notificaciones push (Web Push). Cada usuario administra
-- solo las suyas; el cron del servidor las lee todas con la service role key.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Cada usuario ve solo sus suscripciones push"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Cada usuario inserta solo sus suscripciones push"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Cada usuario actualiza solo sus suscripciones push"
  on push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Cada usuario borra solo sus suscripciones push"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Conexión con Google Calendar. A propósito NO tiene ninguna política para
-- el cliente (ni siquiera de lectura): el refresh_token es sensible y solo
-- debe tocarlo el servidor, con la service role key. El navegador del
-- paciente solo conoce el estado de conexión a través de
-- /api/calendar/status, que nunca regresa los tokens.
create table if not exists calendar_connections (
  user_id uuid references auth.users(id) on delete cascade primary key,
  refresh_token text not null,
  access_token text,
  access_token_expiry timestamptz,
  sync_steps boolean not null default true,
  sync_focus_sessions boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table calendar_connections enable row level security;
-- (sin políticas: con RLS activado y ninguna policy, nadie puede leer ni
-- escribir excepto la service role key, que las ignora por diseño)
