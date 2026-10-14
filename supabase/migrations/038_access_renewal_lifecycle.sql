-- Migration 038: ciclo de acesso e renovação (DEV-151)
-- Aditiva e idempotente. NÃO aplicar da máquina do agente: o Dev aplica depois do ok.
-- purchase_kind distingue compra nova de renovação. renewed_from aponta a subscription anterior.
-- RENOVACOES continua calculado (count de purchase_kind = 'renewal'); a view user_status não muda.
-- O índice (user_id, ends_at DESC) já existe desde a 003; IF NOT EXISTS não duplica.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS purchase_kind TEXT NOT NULL DEFAULT 'new';

-- CHECK fora do ADD COLUMN: IF NOT EXISTS não recria a coluna nem o constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.subscriptions'::regclass
      AND conname = 'subscriptions_purchase_kind_check'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_purchase_kind_check
      CHECK (purchase_kind IN ('new', 'renewal'));
  END IF;
END $$;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS renewed_from UUID NULL
    REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Se a coluna já existia, o ADD COLUMN acima não cria a FK. Garante o constraint na reexecução.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.subscriptions'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%FOREIGN KEY (renewed_from)%'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_renewed_from_fkey
      FOREIGN KEY (renewed_from)
      REFERENCES public.subscriptions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Idempotência dos envios do lifecycle (uma linha por subscription + etapa).
-- variant fica livre para o texto alternativo (ex.: D+15 sem login).
CREATE TABLE IF NOT EXISTS public.access_lifecycle_sends (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID        NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  etapa           TEXT        NOT NULL CHECK (etapa IN ('d+1', 'd+15', 'd-7', 'd-2', 'd0', 'd+7')),
  variant         TEXT        NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subscription_id, etapa)
);

-- Sem policies de propósito: o deny default do RLS bloqueia anon e authenticated.
-- O service_role tem BYPASSRLS e conserva o GRANT padrão da tabela.
ALTER TABLE public.access_lifecycle_sends ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.access_lifecycle_sends FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS subscriptions_user_ends_at_idx
  ON public.subscriptions (user_id, ends_at DESC);
