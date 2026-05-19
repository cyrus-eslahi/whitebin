-- WhiteBin orders schema
-- Run this in Supabase: SQL Editor → New query → Run

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  address text not null,
  phone text not null,
  quantity smallint not null check (quantity in (1, 2)),
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  payment_method text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists orders_order_id_idx on public.orders (order_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Atomic order ID counter (A1 … A99, B1 … B99, …)
create table if not exists public.order_counter (
  id int primary key default 1 check (id = 1),
  letter char(1) not null default 'A',
  number smallint not null default 0
);

insert into public.order_counter (id, letter, number)
values (1, 'A', 0)
on conflict (id) do nothing;

-- Returns next order ID and advances counter (e.g. A1, A2, … A99, B1)
create or replace function public.get_next_order_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  l char(1);
  n smallint;
begin
  update public.order_counter
  set
    number = case
      when number >= 99 then 1
      else number + 1
    end,
    letter = case
      when number >= 99 then chr(ascii(letter) + 1)
      else letter
    end
  where id = 1
  returning letter, number into l, n;

  if l > 'Z' then
    raise exception 'Order ID sequence exhausted';
  end if;

  return l || n::text;
end;
$$;

-- Allow anonymous clients to call get_next_order_id and insert orders
-- (tighten RLS policies for production if needed)
alter table public.orders enable row level security;
alter table public.order_counter enable row level security;

create policy "Allow insert orders"
  on public.orders for insert
  to anon, authenticated
  with check (true);

create policy "Allow read own orders by order_id"
  on public.orders for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant execute on function public.get_next_order_id() to anon, authenticated;
grant select, update on public.order_counter to anon, authenticated;
grant insert, select on public.orders to anon, authenticated;
