-- DEV-284: validar CHECK de analyses.product_type (rodar no banco TESTE após aplicar 058).
-- Esperado: uma linha; convalidated true; definição com os quatro valores do app.

SELECT
  c.conname,
  c.convalidated,
  pg_get_constraintdef(c.oid) AS check_def
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'analyses'
  AND c.conname = 'analyses_product_type_check'
  AND c.contype = 'c';
