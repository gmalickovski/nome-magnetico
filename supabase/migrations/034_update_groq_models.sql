-- Atualiza seeds/config de modelos Groq após depreciação dos Llama (16/08/2026).
-- llama-3.3-70b-versatile / llama-3.1-8b-instant → gpt-oss-120b / gpt-oss-20b.
-- O runtime usa models.ts; esta migration alinha a tabela ai_config se houver rows.

UPDATE public.ai_config
SET model = 'openai/gpt-oss-120b',
    updated_at = now()
WHERE provider = 'groq'
  AND model IN (
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
  )
  AND task IN ('analysis', 'suggestions', 'guide');

UPDATE public.ai_config
SET model = 'openai/gpt-oss-20b',
    updated_at = now()
WHERE provider = 'groq'
  AND model IN ('llama-3.1-8b-instant', 'llama-3.3-70b-versatile')
  AND task = 'support_polish';
