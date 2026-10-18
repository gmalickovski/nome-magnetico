-- Migration 043: Votação do próximo produto (sem PII, contador agregado) e novos campos opcionais do formulário de Nome Social (DEV-190 / DEV-182 F6)

-- 1. Tabela de contagem agregada da votação do próximo produto (zero dado pessoal)
CREATE TABLE IF NOT EXISTS public.product_votes (
  option text PRIMARY KEY CHECK (option IN ('nome_bebe', 'nome_empresa', 'outro')),
  votes_count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inicializa as 3 opções canônicas
INSERT INTO public.product_votes (option, votes_count)
VALUES
  ('nome_bebe', 0),
  ('nome_empresa', 0),
  ('outro', 0)
ON CONFLICT (option) DO NOTHING;

-- RLS ativo: leitura pública do agregado opcional, escrita apenas via função / service role
ALTER TABLE public.product_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_votes' AND policyname = 'product_votes_select_public'
  ) THEN
    CREATE POLICY "product_votes_select_public"
      ON public.product_votes
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END
$$;

-- Função RPC atômica para incrementar apenas o contador agregado (sem gravar IP, cookie ou identificador)
CREATE OR REPLACE FUNCTION public.increment_product_vote(p_option text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count bigint;
BEGIN
  IF p_option NOT IN ('nome_bebe', 'nome_empresa', 'outro') THEN
    RAISE EXCEPTION 'Invalid product vote option: %', p_option;
  END IF;

  UPDATE public.product_votes
  SET votes_count = votes_count + 1,
      updated_at = now()
  WHERE option = p_option
  RETURNING votes_count INTO v_new_count;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_product_vote(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_product_vote(text) TO service_role;

-- 2. Novos campos opcionais em social_name_inputs (DEV-190 §6)
ALTER TABLE public.social_name_inputs
  ADD COLUMN IF NOT EXISTS assinatura_atual text,
  ADD COLUMN IF NOT EXISTS onde_vai_usar text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS aceita_encurtar_apelido boolean NOT NULL DEFAULT false;
