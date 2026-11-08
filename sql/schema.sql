-- Terrain: skema toolstack di project Supabase StudyIng.
-- Setelah dijalankan, tambahkan "toolstack" ke Exposed schemas
-- (Project Settings > Data API) supaya supabase-js bisa membacanya.

create schema if not exists toolstack;

-- Aman dijalankan ulang: tipe, tabel, indeks, dan policy dilewati bila sudah ada.
do $$ begin
  create type toolstack.item_status as enum ('aktif', 'dicoba', 'arsip');
exception when duplicate_object then null; end $$;
do $$ begin
  create type toolstack.target_role as enum ('utama', 'alternatif', 'tugas_kompleks');
exception when duplicate_object then null; end $$;

-- Wilayah. grid_row/grid_col (0 atau 1) dikunci dari hasil layout.py.
create table if not exists toolstack.categories (
  id          text primary key,
  name        text not null,
  icon        text not null,
  description text,
  grid_row    smallint not null check (grid_row in (0, 1)),
  grid_col    smallint not null check (grid_col in (0, 1)),
  unique (grid_row, grid_col)
);

create table if not exists toolstack.tools (
  id         text primary key,
  name       text not null,
  url        text,
  note       text,
  status     toolstack.item_status not null default 'aktif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Peran satu tool di satu wilayah.
create table if not exists toolstack.placements (
  id           bigint generated always as identity primary key,
  tool_id      text not null references toolstack.tools(id) on delete cascade,
  category_id  text not null references toolstack.categories(id) on delete cascade,
  group_name   text,
  display_name text,
  description  text,
  workflows    text[] not null default '{}',
  sort_order   integer not null default 0,
  unique (tool_id, category_id)
);

create table if not exists toolstack.models (
  id               text primary key,
  family           text not null,
  version          text not null,
  provider_tool_id text not null references toolstack.tools(id),
  status           toolstack.item_status not null default 'aktif',
  sort_order       integer not null default 0
);

create table if not exists toolstack.needs (
  id         text primary key,
  name       text not null,
  sort_order integer not null default 0
);

-- Kebutuhan menunjuk ke model ATAU tool, tepat satu.
create table if not exists toolstack.need_targets (
  id         bigint generated always as identity primary key,
  need_id    text not null references toolstack.needs(id) on delete cascade,
  model_id   text references toolstack.models(id) on delete cascade,
  tool_id    text references toolstack.tools(id) on delete cascade,
  role       toolstack.target_role not null default 'utama',
  note       text,
  sort_order integer not null default 0,
  check ((model_id is null) <> (tool_id is null))
);

create index if not exists placements_category_id_idx on toolstack.placements (category_id);
create index if not exists models_provider_tool_id_idx on toolstack.models (provider_tool_id);
create index if not exists need_targets_need_id_idx on toolstack.need_targets (need_id);

-- Akses: hanya pengguna yang login (sign-up dinonaktifkan di project StudyIng).
grant usage on schema toolstack to authenticated;
grant select on all tables in schema toolstack to authenticated;

do $$
declare t text;
begin
  foreach t in array array['categories','tools','placements','models','needs','need_targets'] loop
    execute format('alter table toolstack.%I enable row level security', t);
    execute format('drop policy if exists "baca untuk pengguna login" on toolstack.%I', t);
    execute format(
      'create policy "baca untuk pengguna login" on toolstack.%I for select to authenticated using (true)', t);
  end loop;
end $$;

-- Hak tulis ditambahkan di v1b bersama form edit.
