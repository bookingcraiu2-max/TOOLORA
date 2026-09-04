-- Toolora account + AI usage schema for Supabase
-- Run this in Supabase SQL Editor.

create table if not exists public.toolora_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  month_key text not null,
  used integer not null default 0,
  plan text not null default 'free' check (plan in ('free','pro','ultimate')),
  updated_at timestamptz not null default now()
);

alter table public.toolora_usage enable row level security;

drop policy if exists "Users can read own Toolora usage" on public.toolora_usage;
create policy "Users can read own Toolora usage"
on public.toolora_usage for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.toolora_consume_credit(p_user_id uuid, p_month_key text, p_limit integer)
returns table(allowed boolean, used integer, remaining integer, plan text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_used integer;
  current_plan text;
  effective_limit integer;
begin
  insert into public.toolora_usage(user_id, month_key, used, plan)
  values (p_user_id, p_month_key, 0, 'free')
  on conflict (user_id) do nothing;

  select tu.used, tu.plan into current_used, current_plan
  from public.toolora_usage tu
  where tu.user_id = p_user_id
  for update;

  if (select month_key from public.toolora_usage where user_id=p_user_id) <> p_month_key then
    update public.toolora_usage set month_key=p_month_key, used=0, updated_at=now() where user_id=p_user_id;
    current_used := 0;
  end if;

  effective_limit := case
    when current_plan = 'ultimate' then 300
    when current_plan = 'pro' then 100
    else greatest(0, p_limit)
  end;

  if current_used < effective_limit then
    update public.toolora_usage set used=used+1, updated_at=now() where user_id=p_user_id;
    return query select true, current_used+1, greatest(0, effective_limit-current_used-1), current_plan;
  else
    return query select false, current_used, 0, current_plan;
  end if;
end;
$$;

revoke all on function public.toolora_consume_credit(uuid,text,integer) from public;
