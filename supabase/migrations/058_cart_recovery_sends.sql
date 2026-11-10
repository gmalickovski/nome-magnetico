-- DEV-278: deduplicação persistente de cart.abandoned (um envio por pessoa e produto)

create table if not exists public.cart_recovery_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_type text not null check (product_type in ('nome_social', 'nome_bebe', 'nome_empresa')),
  created_at timestamptz not null default now(),
  constraint cart_recovery_sends_user_product_unique unique (user_id, product_type)
);

create index if not exists idx_cart_recovery_sends_user_id
  on public.cart_recovery_sends(user_id);

alter table public.cart_recovery_sends enable row level security;

grant all on public.cart_recovery_sends to service_role;
