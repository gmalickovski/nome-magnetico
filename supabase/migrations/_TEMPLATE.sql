-- Template canônico para migrations novas no schema public (mudança Supabase 30/10/2026).
-- Toda tabela nova DEVE conter RLS habilitado, GRANTs mínimos explícitos por role e índices em FKs.
-- O prefixo '_' garante que este modelo não seja executado automaticamente pelo runner de migrations.

CREATE TABLE IF NOT EXISTS public.exemplo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FK sempre com índice de cobertura
CREATE INDEX IF NOT EXISTS exemplo_user_id_idx ON public.exemplo (user_id);

-- RLS obrigatório
ALTER TABLE public.exemplo ENABLE ROW LEVEL SECURITY;

-- GRANT explícito e mínimo por role (escolher e descomentar conforme o caso de uso):
-- Caso 1: Somente backend/servidor via service_role:
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exemplo TO service_role;

-- Caso 2: Leitura pública (se aplicável ao caso):
-- GRANT SELECT ON public.exemplo TO anon, authenticated;

-- Caso 3: Dono autenticado (leitura e escrita do próprio usuário):
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.exemplo TO authenticated;

-- Políticas RLS com TO <role> explícito e (select auth.uid()) para otimização de InitPlan:
CREATE POLICY "exemplo_select_own"
  ON public.exemplo FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "exemplo_insert_own"
  ON public.exemplo FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "exemplo_service_all"
  ON public.exemplo FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
