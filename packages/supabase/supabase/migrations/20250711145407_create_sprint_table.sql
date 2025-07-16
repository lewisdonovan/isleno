-- 1. Create table
create table public.sprint_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monday_id bigint not null,
  sprint_start_date date not null,
  sprint_end_date date not null,
  is_active boolean not null default false,
  is_archived boolean not null default false,
  inserted_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone default timezone('utc', now()) not null
);

-- 2. Add index to support ordering and lookups
create index sprint_boards_start_date_idx on public.sprint_boards (sprint_start_date desc);
create index sprint_boards_monday_id_idx on public.sprint_boards (monday_id);
create index sprint_boards_active_idx on public.sprint_boards (is_active);
create index sprint_boards_archived_idx on public.sprint_boards (is_archived);

-- 3. Trigger to update `updated_at` timestamp automatically
create or replace function public.update_sprint_board_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_sprint_board_timestamp
before update on public.sprint_boards
for each row
execute procedure public.update_sprint_board_timestamp();

-- 4. Enable RLS
alter table public.sprint_boards enable row level security;

-- 5. RLS policy: allow read/write to service role only (recommended for automation tables)
create policy "Allow read/write to service role"
on public.sprint_boards
for all
to service_role
using (true)
with check (true);