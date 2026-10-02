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
  updated_at timestamptz not null default now()
);

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
