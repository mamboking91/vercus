-- ============================================================
-- VERCUS — Schema SQL para Supabase
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ============================================================

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ─── ENUMS ─────────────────────────────────────────────────

create type machine_type as enum (
  'tractor', 'motosierra', 'desbrozadora', 'electrica', 'otro'
);

create type work_order_status as enum (
  'recibida', 'presupuestada', 'aceptada',
  'esperando_piezas', 'en_reparacion', 'lista', 'entregada'
);

create type quote_status as enum (
  'borrador', 'enviado', 'aceptado', 'rechazado'
);

create type payment_method as enum (
  'efectivo', 'transferencia', 'tarjeta', 'otro'
);

-- ─── SETTINGS ──────────────────────────────────────────────

create table settings (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null unique,
  business_name   text not null default '',
  owner_name      text not null default '',
  phone           text not null default '',
  address         text not null default '',
  logo_url        text,
  tax_id          text not null default '',
  default_iva_rate integer not null default 21
);

alter table settings enable row level security;
create policy "Usuario accede a sus settings" on settings
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── CLIENTS ───────────────────────────────────────────────

create table clients (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  phone      text,
  email      text,
  address    text,
  notes      text,
  created_at timestamptz not null default now()
);

alter table clients enable row level security;
create policy "Usuario accede a sus clientes" on clients
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index clients_user_id_idx on clients(user_id);

-- ─── MACHINES ──────────────────────────────────────────────

create table machines (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  client_id     uuid references clients(id) on delete cascade not null,
  brand         text,
  model         text,
  serial_number text,
  type          machine_type not null default 'otro',
  notes         text,
  created_at    timestamptz not null default now()
);

alter table machines enable row level security;
create policy "Usuario accede a sus maquinas" on machines
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index machines_client_id_idx on machines(client_id);

-- ─── LABOR TYPES ───────────────────────────────────────────

create table labor_types (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  hourly_rate numeric(10,2) not null default 0
);

alter table labor_types enable row level security;
create policy "Usuario accede a sus tipos de labor" on labor_types
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Datos de ejemplo (se insertan tras el login desde la app)

-- ─── PARTS CATALOG ─────────────────────────────────────────

create table parts_catalog (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  code        text,
  brand       text,
  description text not null,
  sell_price  numeric(10,2) not null default 0,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table parts_catalog enable row level security;
create policy "Usuario accede a su catalogo" on parts_catalog
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index parts_catalog_user_id_idx on parts_catalog(user_id);

-- ─── WORK ORDERS ───────────────────────────────────────────

create table work_orders (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid references auth.users(id) on delete cascade not null,
  client_id            uuid references clients(id) on delete restrict not null,
  machine_id           uuid references machines(id) on delete set null,
  order_number         text not null,
  status               work_order_status not null default 'recibida',
  problem_description  text,
  diagnosis            text,
  internal_notes       text,
  estimated_delivery   date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table work_orders enable row level security;
create policy "Usuario accede a sus ordenes" on work_orders
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index work_orders_user_id_idx on work_orders(user_id);
create index work_orders_client_id_idx on work_orders(client_id);
create index work_orders_status_idx on work_orders(status);

-- Auto-actualizar updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger work_orders_updated_at
  before update on work_orders
  for each row execute function update_updated_at();

-- ─── WORK ORDER STATUS LOG ─────────────────────────────────

create table work_order_status_log (
  id             uuid primary key default uuid_generate_v4(),
  work_order_id  uuid references work_orders(id) on delete cascade not null,
  from_status    work_order_status,
  to_status      work_order_status not null,
  changed_at     timestamptz not null default now()
);

alter table work_order_status_log enable row level security;
create policy "Usuario accede al log de sus ordenes" on work_order_status_log
  using (
    exists (
      select 1 from work_orders wo
      where wo.id = work_order_id and wo.user_id = auth.uid()
    )
  );

-- ─── WORK ORDER PARTS ──────────────────────────────────────

create table work_order_parts (
  id              uuid primary key default uuid_generate_v4(),
  work_order_id   uuid references work_orders(id) on delete cascade not null,
  catalog_part_id uuid references parts_catalog(id) on delete set null,
  code            text,
  description     text not null,
  brand           text,
  quantity        numeric(10,2) not null default 1,
  unit_price      numeric(10,2) not null default 0
);

alter table work_order_parts enable row level security;
create policy "Usuario accede a las piezas de sus ordenes" on work_order_parts
  using (
    exists (
      select 1 from work_orders wo
      where wo.id = work_order_id and wo.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from work_orders wo
      where wo.id = work_order_id and wo.user_id = auth.uid()
    )
  );

-- ─── WORK ORDER LABOR ──────────────────────────────────────

create table work_order_labor (
  id             uuid primary key default uuid_generate_v4(),
  work_order_id  uuid references work_orders(id) on delete cascade not null,
  labor_type_id  uuid references labor_types(id) on delete set null,
  description    text,
  hours          numeric(10,2) not null default 0,
  unit_rate      numeric(10,2) not null default 0
);

alter table work_order_labor enable row level security;
create policy "Usuario accede a la labor de sus ordenes" on work_order_labor
  using (
    exists (
      select 1 from work_orders wo
      where wo.id = work_order_id and wo.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from work_orders wo
      where wo.id = work_order_id and wo.user_id = auth.uid()
    )
  );

-- ─── QUOTES ────────────────────────────────────────────────

create table quotes (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  work_order_id  uuid references work_orders(id) on delete cascade not null,
  quote_number   text not null,
  include_iva    boolean not null default false,
  iva_rate       integer not null default 21,
  status         quote_status not null default 'borrador',
  valid_until    date,
  notes          text,
  created_at     timestamptz not null default now()
);

alter table quotes enable row level security;
create policy "Usuario accede a sus presupuestos" on quotes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── PAYMENTS ──────────────────────────────────────────────

create table payments (
  id             uuid primary key default uuid_generate_v4(),
  work_order_id  uuid references work_orders(id) on delete cascade not null,
  amount         numeric(10,2) not null,
  date           date not null default current_date,
  method         payment_method not null default 'efectivo',
  notes          text
);

alter table payments enable row level security;
create policy "Usuario accede a los pagos de sus ordenes" on payments
  using (
    exists (
      select 1 from work_orders wo
      where wo.id = work_order_id and wo.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from work_orders wo
      where wo.id = work_order_id and wo.user_id = auth.uid()
    )
  );

-- ─── EXPENSES ──────────────────────────────────────────────

create table expenses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null default current_date,
  description text not null,
  category    text not null default 'Otro',
  amount      numeric(10,2) not null
);

alter table expenses enable row level security;
create policy "Usuario accede a sus gastos" on expenses
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── STORAGE ───────────────────────────────────────────────
-- Ejecutar esto desde el panel de Storage de Supabase o con:
-- insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
