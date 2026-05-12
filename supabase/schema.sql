-- ============================================================
-- El Regreso Control — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Users table (perfiles del equipo)
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid references auth.users(id) on delete set null,
  nombre     text not null,
  iniciales  text not null,
  rol        text not null,
  area       text not null,
  email      text unique not null,
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists tasks (
  id                uuid primary key default gen_random_uuid(),
  titulo            text not null,
  descripcion       text default '',
  area              text not null,
  sub_area          text,
  responsable_id    uuid references users(id) on delete set null,
  plazo             timestamptz not null,
  estado            text not null default 'Asignada'
                    check (estado in ('Asignada','En Proceso','Por Aprobar','Atrasada','Completada','Rechazada')),
  prioridad_maxima  boolean default false,
  evidencia_url     text,
  contador_retrasos int default 0,
  nota_rechazo      text,
  creado_por        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now()
);

-- RLS: enable
alter table users enable row level security;
alter table tasks enable row level security;

-- Users: anyone authenticated can read, only service role can insert/update
create policy "users_read" on users for select using (auth.role() = 'authenticated');
create policy "tasks_read" on tasks for select using (auth.role() = 'authenticated');
create policy "tasks_insert" on tasks for insert with check (auth.role() = 'authenticated');
create policy "tasks_update" on tasks for update using (auth.role() = 'authenticated');

-- ============================================================
-- Seed data — equipo inicial
-- ============================================================
insert into users (nombre, iniciales, rol, area, email) values
  ('Claudio H.',    'CH', 'Gerente Comercial',    'Ventas',              'claudio@elregresobeer.com'),
  ('María R.',      'MR', 'Ejecutiva de Ventas',  'Ventas',              'maria@elregresobeer.com'),
  ('Felipe A.',     'FA', 'Marketing Manager',    'Marketing',           'felipe@elregresobeer.com'),
  ('Sofía T.',      'ST', 'Diseñadora',            'Marketing',           'sofia@elregresobeer.com'),
  ('Andrés C.',     'AC', 'Jefe de Logística',    'Logística',           'andres@elregresobeer.com'),
  ('Valentina P.',  'VP', 'Controller',            'Control de Gestión',  'valentina@elregresobeer.com')
on conflict (email) do nothing;
