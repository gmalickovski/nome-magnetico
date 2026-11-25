create table public.nm_paid_visitors (
  id uuid primary key,
  consent_epoch uuid not null default gen_random_uuid(),
  analytics boolean not null,
  ads boolean not null,
  click jsonb,
  ga jsonb,
  updated_at timestamptz not null default statement_timestamp(),
  check (not ads or analytics)
);

create table public.nm_paid_checkouts (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references public.nm_paid_visitors(id) on delete cascade,
  consent_epoch uuid not null,
  click jsonb,
  ga jsonb,
  created_at timestamptz not null default statement_timestamp()
);

create index nm_paid_checkouts_visitor_idx on public.nm_paid_checkouts (visitor_id);
create index nm_paid_checkouts_expiry_idx on public.nm_paid_checkouts (created_at);
create index nm_paid_visitors_expiry_idx on public.nm_paid_visitors (updated_at);

create table public.nm_purchase_deliveries (
  order_id text not null,
  destination text not null check (destination in ('posthog', 'ga4', 'meta')),
  checkout_id uuid references public.nm_paid_checkouts(id) on delete set null,
  paid_at timestamptz not null,
  payload jsonb not null,
  attempts integer not null default 0,
  due_at timestamptz not null default statement_timestamp(),
  lease_id uuid,
  lease_until timestamptz,
  finished_at timestamptz,
  outcome text check (outcome in ('sent', 'skipped', 'failed')),
  primary key (order_id, destination)
);

create index nm_purchase_deliveries_checkout_idx on public.nm_purchase_deliveries (checkout_id);
create index nm_purchase_deliveries_due_idx on public.nm_purchase_deliveries (due_at)
  where finished_at is null;
create index nm_purchase_deliveries_expiry_idx on public.nm_purchase_deliveries (paid_at);

alter table public.nm_paid_visitors enable row level security;
alter table public.nm_paid_checkouts enable row level security;
alter table public.nm_purchase_deliveries enable row level security;
revoke all on public.nm_paid_visitors, public.nm_paid_checkouts, public.nm_purchase_deliveries from public, anon, authenticated, service_role;
grant select, insert, update on public.nm_paid_visitors, public.nm_paid_checkouts, public.nm_purchase_deliveries to service_role;
grant delete on public.nm_paid_visitors, public.nm_paid_checkouts, public.nm_purchase_deliveries to service_role;
create policy nm_paid_visitors_server on public.nm_paid_visitors for all to service_role using (true) with check (true);
create policy nm_paid_checkouts_server on public.nm_paid_checkouts for all to service_role using (true) with check (true);
create policy nm_purchase_deliveries_server on public.nm_purchase_deliveries for all to service_role using (true) with check (true);

create function public.nm_paid_update_visitor(p_id uuid, p_analytics boolean, p_ads boolean, p_touch jsonb, p_ga jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  now_at timestamptz := statement_timestamp();
begin
  if p_analytics is not null then
    insert into public.nm_paid_visitors as visitor (id, analytics, ads, click)
    values (
      p_id, p_analytics, p_ads,
      case when p_ads and p_touch is not null then jsonb_build_object('touch', p_touch, 'first_at', now_at) end
    )
    on conflict (id) do update set
      analytics = excluded.analytics,
      ads = excluded.ads,
      updated_at = now_at,
      consent_epoch = case
        when visitor.analytics is distinct from excluded.analytics or visitor.ads is distinct from excluded.ads
          then gen_random_uuid()
        else visitor.consent_epoch
      end,
      ga = case when excluded.analytics then visitor.ga end,
      click = case
        when not excluded.ads then null
        when (visitor.click->>'first_at')::timestamptz > now_at - interval '7 days' then visitor.click
        else excluded.click
      end;

    if not p_ads then
      update public.nm_paid_checkouts set click = null where visitor_id = p_id and click is not null;
    end if;
    if not p_analytics then
      update public.nm_paid_checkouts set ga = null where visitor_id = p_id and ga is not null;
    end if;
  else
    update public.nm_paid_visitors as visitor set
      ga = coalesce(p_ga, visitor.ga),
      click = case
        when not visitor.ads then null
        when (visitor.click->>'first_at')::timestamptz > now_at - interval '7 days' then visitor.click
        when p_touch is not null then jsonb_build_object('touch', p_touch, 'first_at', now_at)
      end,
      updated_at = now_at
    where visitor.id = p_id and visitor.analytics
      and visitor.updated_at > now_at - interval '10 days';
  end if;
end;
$$;

create function public.nm_paid_active_click(p_visitor_id uuid)
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  select click from public.nm_paid_visitors
  where id = p_visitor_id and ads
    and (click->>'first_at')::timestamptz > statement_timestamp() - interval '7 days';
$$;

create function public.nm_paid_checkout_snapshot(p_visitor_id uuid)
returns uuid
language sql security invoker
set search_path = ''
as $$
  insert into public.nm_paid_checkouts (visitor_id, consent_epoch, click, ga)
  select id, consent_epoch,
    case when ads and (click->>'first_at')::timestamptz > statement_timestamp() - interval '7 days' then click end,
    ga
  from public.nm_paid_visitors
  where id = p_visitor_id and analytics and updated_at > statement_timestamp() - interval '10 days'
  for share
  returning id;
$$;

create function public.nm_paid_delivery_context(p_checkout_id uuid, p_paid_at timestamptz)
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'click', case when visitor.ads
      and p_paid_at >= (checkout.click->>'first_at')::timestamptz
      and p_paid_at < (checkout.click->>'first_at')::timestamptz + interval '7 days'
      then checkout.click end,
    'ga', checkout.ga,
    'ads', visitor.ads
  )
  from public.nm_paid_checkouts as checkout
  join public.nm_paid_visitors as visitor on visitor.id = checkout.visitor_id
  where checkout.id = p_checkout_id and visitor.analytics
    and checkout.consent_epoch = visitor.consent_epoch
    and checkout.created_at > statement_timestamp() - interval '10 days';
$$;

create function public.nm_enqueue_purchase(p_order_id text, p_checkout_id uuid, p_paid_at timestamptz, p_payload jsonb)
returns void
language plpgsql security invoker
set search_path = ''
as $$
declare
  snapshot_id uuid;
begin
  select id into snapshot_id from public.nm_paid_checkouts where id = p_checkout_id for key share;
  insert into public.nm_purchase_deliveries (order_id, checkout_id, paid_at, destination, payload)
  values (p_order_id, snapshot_id, p_paid_at, 'posthog', p_payload),
         (p_order_id, snapshot_id, p_paid_at, 'ga4', p_payload)
  on conflict (order_id, destination) do nothing;
end;
$$;

create function public.nm_claim_purchase_deliveries(p_lease_id uuid, p_order_id text default null)
returns setof public.nm_purchase_deliveries
language sql security invoker
set search_path = ''
as $$
  with ready as (
    select order_id, destination from public.nm_purchase_deliveries
    where finished_at is null and due_at <= statement_timestamp()
      and (lease_until is null or lease_until <= statement_timestamp())
      and (p_order_id is null or order_id = p_order_id)
    order by due_at, order_id, destination
    limit 12 for update skip locked
  )
  update public.nm_purchase_deliveries as delivery
  set lease_id = p_lease_id, lease_until = statement_timestamp() + interval '3 minutes',
      attempts = attempts + 1
  from ready where delivery.order_id = ready.order_id and delivery.destination = ready.destination
  returning delivery.*;
$$;

create function public.nm_clean_paid_attribution()
returns void
language sql security invoker
set search_path = ''
as $$
  delete from public.nm_paid_checkouts where created_at < statement_timestamp() - interval '10 days';
  delete from public.nm_paid_visitors where updated_at < statement_timestamp() - interval '10 days';
  update public.nm_paid_visitors set click = null
    where (click->>'first_at')::timestamptz < statement_timestamp() - interval '7 days';
  delete from public.nm_purchase_deliveries where paid_at < statement_timestamp() - interval '30 days';
$$;

revoke all on function public.nm_paid_update_visitor(uuid, boolean, boolean, jsonb, jsonb),
  public.nm_paid_active_click(uuid), public.nm_paid_checkout_snapshot(uuid),
  public.nm_enqueue_purchase(text, uuid, timestamptz, jsonb),
  public.nm_paid_delivery_context(uuid, timestamptz), public.nm_claim_purchase_deliveries(uuid, text),
  public.nm_clean_paid_attribution() from public, anon, authenticated, service_role;
grant execute on function public.nm_paid_update_visitor(uuid, boolean, boolean, jsonb, jsonb),
  public.nm_paid_active_click(uuid), public.nm_paid_checkout_snapshot(uuid),
  public.nm_enqueue_purchase(text, uuid, timestamptz, jsonb),
  public.nm_paid_delivery_context(uuid, timestamptz), public.nm_claim_purchase_deliveries(uuid, text),
  public.nm_clean_paid_attribution() to service_role;
