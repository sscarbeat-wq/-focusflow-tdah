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

-- "Memoria ANRO" (3 de noviembre de 2026) — bucket de Supabase Storage para
-- las fotos que se adjuntan a una nota de Captura rápida (ver
-- QUICK_NOTE_PHOTOS_BUCKET en src/quickCapture.js). Primera vez que este
-- proyecto usa Storage en vez de solo tablas/JSON — a propósito un bucket
-- PRIVADO (public = false): nunca se calcula una URL pública para una foto,
-- el navegador siempre pide una URL firmada al momento (createSignedUrl,
-- ver CaptureHubPanel.jsx) para poder mostrarla o abrirla.
--
-- Cada archivo se sube con la ruta "{user_id}/archivo.ext" (ver
-- handlePhotoSelected en CaptureHubPanel.jsx) — las 3 políticas de abajo
-- usan storage.foldername(name), la función que ya documenta Supabase para
-- este patrón exacto, para que cada paciente SOLO pueda subir/ver/borrar
-- dentro de su propia carpeta (comparando el primer segmento de la ruta
-- contra auth.uid()), igual de espíritu que "auth.uid() = user_id" en el
-- resto de las tablas de este archivo. Sin política de UPDATE a propósito:
-- una foto ya subida no se edita, solo se borra y se sube una nueva si
-- hiciera falta (nunca pasa hoy, porque la UI no ofrece "reemplazar foto").
insert into storage.buckets (id, name, public)
values ('quick-note-photos', 'quick-note-photos', false)
on conflict (id) do nothing;

create policy "Cada usuario sube fotos solo a su propia carpeta"
  on storage.objects for insert
  with check (
    bucket_id = 'quick-note-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Cada usuario ve solo las fotos de su propia carpeta"
  on storage.objects for select
  using (
    bucket_id = 'quick-note-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Cada usuario borra solo las fotos de su propia carpeta"
  on storage.objects for delete
  using (
    bucket_id = 'quick-note-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- "Memoria ANRO" (3 de noviembre de 2026) — notificación push de actividad
-- en el Cuerpo doble virtual (ver api/body-double-ping.js). La sala en sí
-- sigue siendo 100% efímera (Supabase Realtime Presence, ver
-- src/bodyDouble.js) y esta tabla no guarda NADA sobre quién entró ni
-- cuándo por persona — es solo un semáforo de UNA fila para que el
-- endpoint no mande un push cada vez que alguien entra a la sala (podría
-- ser varias veces por minuto si varias personas van entrando/saliendo),
-- sino como máximo una vez cada BODY_DOUBLE_PING_COOLDOWN_MIN minutos (ver
-- esa constante en api/body-double-ping.js). Sin política de cliente a
-- propósito: solo el servidor (service role key) necesita tocar esta
-- tabla, igual que calendar_connections.
create table if not exists body_double_pings (
  id smallint primary key default 1,
  last_ping_at timestamptz,
  constraint body_double_pings_single_row check (id = 1)
);

alter table body_double_pings enable row level security;
-- (sin políticas: ver el comentario de arriba — mismo criterio que
-- calendar_connections)
