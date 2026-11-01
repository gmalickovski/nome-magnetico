-- DEV-261: Escolha de assinatura no checkout do chat Nome Social e controle idempotente de PDF automatico

create table if not exists public.chat_checkout_choices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid null references public.analyses(id) on delete set null,
  chosen_signature text null check (chosen_signature is null or char_length(chosen_signature) <= 80),
  source text null check (source is null or source in ('card_pdf', 'paywall_free')),
  stripe_session_id text not null unique,
  pdf_generated_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_checkout_choices_user_id
  on public.chat_checkout_choices(user_id);

create index if not exists idx_chat_checkout_choices_analysis_id
  on public.chat_checkout_choices(analysis_id);

alter table public.chat_checkout_choices enable row level security;

create policy "own rows read" on public.chat_checkout_choices
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.chat_checkout_choices to authenticated;
grant all on public.chat_checkout_choices to service_role;
